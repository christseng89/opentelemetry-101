import { initializeTelemetry } from './telemetry';
const telemetry = initializeTelemetry('todo-service');
const { meter, spans, logger } = telemetry;
import express from 'express';
import axios from 'axios';
import { context, propagation } from "@opentelemetry/api";
const app = express();

import Redis from "ioredis";
const redis = new Redis({ host: 'redis' });

const calls = meter.createHistogram('http-calls');

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
        await spans.run('GET /todos', async () => {
            const baggage = propagation.createBaggage({
                "user.plan": {
                    value: "enterprise"
                }
            })
            const contextWithBaggage = propagation.setBaggage(context.active(), baggage);
            await context.with(contextWithBaggage, async () => {
                const user = await axios.get('http://auth:8080/auth');
                const todoKeys = await redis.keys('todo:*');
                const todos: any = [];
                for (let i = 0; i < todoKeys.length; i++) {
                    const todoItem = await redis.get(todoKeys[i])
                    if (todoItem) {
                        todos.push(JSON.parse(todoItem));
                    }
                }

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


async function init() {
    await spans.run('Set default items', async () => {
        await Promise.all([
            redis.set('todo:1', JSON.stringify({ name: 'Install OpenTelemetry SDK' })),
            redis.set('todo:2', JSON.stringify({ name: 'Deploy OpenTelemetry Collector' })),
            redis.set('todo:3', JSON.stringify({ name: 'Configure sampling rule' })),
            redis.set('todo:4', JSON.stringify({ name: 'You are OpenTelemetry master!' }))
        ]);
    }, {
        'app.operation': 'seed-todos',
        'db.system': 'redis',
    });

}
init();
