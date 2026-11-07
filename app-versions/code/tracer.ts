import { initializeTelemetry } from './telemetry';

function start(serviceName: string) {
    return initializeTelemetry(serviceName).metrics;
}

export default start
