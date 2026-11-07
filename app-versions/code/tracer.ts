import { initializeTelemetry } from './telemetry';

function start(serviceName: string) {
    return initializeTelemetry(serviceName).meter;
}

export default start
