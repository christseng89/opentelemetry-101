import { metrics } from '@opentelemetry/api';
import type { CsAttributes } from './cs-spans';
import type { CsHistogram, CsMetrics } from './cs-metrics';

class OpenTelemetryHistogram implements CsHistogram {
    constructor(private readonly histogram: ReturnType<ReturnType<typeof metrics.getMeter>['createHistogram']>) {}

    record(value: number, attributes?: CsAttributes): void {
        this.histogram.record(value, attributes as never);
    }
}

export class OpenTelemetryMetrics implements CsMetrics {
    private readonly meter;

    constructor(serviceName: string) {
        this.meter = metrics.getMeter(`${serviceName}.meter`);
    }

    histogram(name: string): CsHistogram {
        return new OpenTelemetryHistogram(this.meter.createHistogram(name));
    }
}
