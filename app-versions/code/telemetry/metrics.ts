import { metrics, type Meter } from '@opentelemetry/api';

export function getMeter(serviceName: string): Meter {
    return metrics.getMeter(`${serviceName}.meter`);
}
