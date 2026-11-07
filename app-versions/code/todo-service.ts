import { initializeTelemetry } from './telemetry';
const telemetry = initializeTelemetry('todo-service');
const { metrics, tracer, logger, redis: redisFactory } = telemetry;
import express from 'express';
import axios from 'axios';
import { context, propagation } from "@opentelemetry/api";
const app = express();
app.disable('x-powered-by');

const authServiceUrl = process.env.AUTH_SERVICE_URL
    ?? [process.env.AUTH_SERVICE_PROTOCOL ?? 'http', process.env.AUTH_SERVICE_HOST ?? 'auth:8080'].join('://');
const javaTodoServiceUrl = process.env.JAVA_TODO_SERVICE_URL
    ?? [process.env.JAVA_TODO_SERVICE_PROTOCOL ?? 'http', process.env.JAVA_TODO_SERVICE_HOST ?? 'java-todo:8080'].join('://');
const redisUrl = process.env.REDIS_URL
    ?? ['redis', process.env.REDIS_HOST ?? 'redis:6379'].join('://');
let redisClient: Awaited<ReturnType<typeof redisFactory.create>> | undefined;
let ioredisClient: Awaited<ReturnType<typeof redisFactory.create>> | undefined;

const getRedis = async () => {
    if (redisClient) {
        return redisClient;
    }

    redisClient = await redisFactory.create(redisUrl, 'redis');
    return redisClient;
};

const getIORedis = async () => {
    if (ioredisClient) {
        return ioredisClient;
    }

    ioredisClient = await redisFactory.create(redisUrl, 'ioredis');
    return ioredisClient;
};

const calls = metrics.histogram('http-calls');

app.use((req, res, next) => {
    const startTime = Date.now();
    req.on('end', () => {
        const endTime = Date.now();
        calls.record(endTime - startTime, {
            route: req.route?.path,
            status: res.statusCode,
            method: req.method
        })
    })
    next();
})

const sleep = (time: number) => { return new Promise((resolve) => { setTimeout(resolve, time) }) };


app.get('/todos', async (req, res) => {
    try {
        await tracer.run('GET /todos', async (span) => {
            const traceId = span.traceId();
            if (traceId) {
                res.setHeader('X-Trace-Id', traceId);
            }
            const baggage = propagation.createBaggage({
                "user.plan": {
                    value: "enterprise"
                }
            })
            const contextWithBaggage = propagation.setBaggage(context.active(), baggage);
            await context.with(contextWithBaggage, async () => {
                const user = await axios.get(`${authServiceUrl}/auth`);
                const redisResponse = await (await getRedis()).ping();
                span.setAttribute('redis.operation', 'PING');
                span.setAttribute('redis.response', redisResponse);
                const ioredisResponse = await (await getIORedis()).ping();
                span.setAttribute('ioredis.operation', 'PING');
                span.setAttribute('ioredis.response', ioredisResponse);
                const redisHashKey = 'otel:redis:demo';
                const redisHashField = 'trace_id';
                const traceValue = span.traceId() ?? 'unknown';
                const redisClient = await getRedis();
                await redisClient.hSet(redisHashKey, redisHashField, traceValue);
                const redisHashValue = await redisClient.hGet(redisHashKey, redisHashField);
                await redisClient.hDel(redisHashKey, redisHashField);
                span.setAttribute('redis.hash.hget_matches', redisHashValue === traceValue);
                const ioredisClient = await getIORedis();
                await ioredisClient.hSet(redisHashKey, redisHashField, traceValue);
                const ioredisHashValue = await ioredisClient.hGet(redisHashKey, redisHashField);
                await ioredisClient.hDel(redisHashKey, redisHashField);
                span.setAttribute('ioredis.hash.hget_matches', ioredisHashValue === traceValue);
                const todos = await tracer.run('Fetch todos from Java service', async (span) => {
                    const headers: Record<string, string> = {};
                    propagation.inject(context.active(), headers);
                    span.setAttribute('traceparent.injected', Boolean(headers.traceparent));
                    const response = await axios.get(`${javaTodoServiceUrl}/api/todos`, { headers });
                    span.setAttribute('todo.count', response.data.length);
                    return response.data;
                }, {
                    'app.operation': 'fetch-java-todos',
                    'peer.service': 'java-todo-service',
                    'server.address': 'java-todo',
                    'server.port': 8080,
                    'http.request.method': 'GET',
                    'url.path': '/api/todos',
                });
                await tracer.run('java-to-do-completed', (span) => {
                    span.setAttribute('completion.status', 'completed');
                    span.setAttribute('peer.service', 'java-todo-service');
                    span.setAttribute('todo.count', todos.length);
                }, {
                    'app.operation': 'java-to-do-completed',
                    'peer.service': 'java-todo-service',
                    'todo.count': todos.length,
                    'completion.status': 'completed',
                });

                if (req.query['slow']) {
                    await sleep(1000);
                }

                if (req.query['fail']) {
                    throw new Error('Really bad error!')
                }

                res.json({ todos, user: user.data });
            });
        }, {
            'http.request.method': req.method,
            'url.path': req.path,
            'http.route': '/todos',
            'app.operation': 'list-todos',
            'app.request.slow': Boolean(req.query['slow']),
            'app.request.fail': Boolean(req.query['fail']),
        });
    } catch (error) {
        logger.error('Failed to load todos', error, { route: '/todos' });
        if (!res.headersSent) {
            res.sendStatus(500);
        }
    }
})

app.listen(8080, () => {
    logger.info('service is up and running!', { port: 8080 });
})
