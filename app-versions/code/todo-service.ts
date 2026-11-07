import { initializeTelemetry } from './telemetry';
const telemetry = initializeTelemetry('todo-service');
const { metrics, tracer, logger } = telemetry;
import express from 'express';
import axios from 'axios';
import { context, propagation } from "@opentelemetry/api";
const app = express();

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
                const user = await axios.get('http://auth:8080/auth');
                const todos = await tracer.run('Fetch todos from Java service', async (span) => {
                    const headers: Record<string, string> = {};
                    propagation.inject(context.active(), headers);
                    span.setAttribute('traceparent.injected', Boolean(headers.traceparent));
                    const response = await axios.get('http://java-todo:8080/api/todos', { headers });
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
