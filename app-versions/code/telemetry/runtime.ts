import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, ParentBasedSampler } from '@opentelemetry/sdk-trace';
import { getMeter } from './metrics';
import { OTelLogger } from './logger';
import { SpanManager } from './spans';
import { getTracer } from './tracer';
import { OurSampler } from '../ourSampler';

const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://collector:4318';

export interface TelemetryRuntime {
    meter: ReturnType<typeof getMeter>;
    spans: SpanManager;
    logger: OTelLogger;
    shutdown(): Promise<void>;
}

export function initializeTelemetry(serviceName: string): TelemetryRuntime {
    const sdk = new NodeSDK({
        spanProcessors: [
            new BatchSpanProcessor({
                exporter: new OTLPTraceExporter({
                    url: `${collectorEndpoint}/v1/traces`,
                }),
            }),
        ],
        logRecordProcessors: [
            new BatchLogRecordProcessor({
                exporter: new OTLPLogExporter({
                    url: `${collectorEndpoint}/v1/logs`,
                }),
            }),
        ],
        metricReaders: [
            new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: `${collectorEndpoint}/v1/metrics`,
                }),
                exportIntervalMillis: 5000,
            }),
        ],
        instrumentations: [getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        })],
        autoDetectResources: true,
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: serviceName,
            'team.owner': 'core-team',
            deployment: '4',
        }),
        sampler: new ParentBasedSampler({
            root: new OurSampler(),
        }),
    });

    sdk.start();

    return {
        meter: getMeter(serviceName),
        spans: new SpanManager(getTracer(serviceName)),
        logger: new OTelLogger(serviceName),
        shutdown: () => sdk.shutdown(),
    };
}
