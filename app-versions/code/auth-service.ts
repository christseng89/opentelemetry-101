import { initializeTelemetry } from './telemetry';
const { tracer, logger } = initializeTelemetry('auth-service');
import { propagation } from '@opentelemetry/api';
import express from 'express';
const app = express();
app.disable('x-powered-by');

const authServicePort = Number(process.env.AUTH_SERVICE_PORT ?? 8080);

app.get('/auth',(req,res)=>{
    void tracer.run('GET /auth', (span) => {
            const traceId = span.traceId();
            if (traceId) {
                res.setHeader('X-Trace-Id', traceId);
            }
            const baggage = propagation.getActiveBaggage();
            logger.debug('received baggage', {
                baggage: baggage ? JSON.stringify(baggage.getAllEntries()) : '{}',
            });
            res.json({username: 'Chris Tseng', userId:123})
    }).catch((error) => {
        logger.error('Failed to authenticate request', error, { route: '/auth' });
        if (!res.headersSent) {
            res.sendStatus(500);
        }
    });
})

app.listen(authServicePort, () => {
    logger.info('service is up and running!', { port: authServicePort });
})
