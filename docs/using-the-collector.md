# Running and using the OpenTelemetry collector

### Configure the collector
Add the following content to `compose/collector/collector.yml`.
```
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    send_timestamps: true
    namespace: otel
    const_labels:
      via: collector
  otlp:
    endpoint: jaeger:4317
    tls:
      insecure: true

extensions:
  health_check:

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
```

### Run the collector
Add the following service to `compose/compose.yaml`.
```
  collector:
    image: otel/opentelemetry-collector-contrib:0.163.2
    volumes: 
      - ./collector/collector.yml:/etc/otel-collector-config.yaml:ro
    command: ["--config=/etc/otel-collector-config.yaml"]
    ports:
      - "8889:8889"
      - "4317:4317"
      - "4318:4318"
    depends_on:
      - jaeger
      - prometheus
```

Also, add to Jaeger to following port `14250`

### Adjust Prometheus to scrap to collector
Replace the target configuration in `prometheus.yml` to  `- targets: ['collector:8889']`


### Adjust The OpenTelemetry collector traces
Change to `OTLPTraceExporter` URL to `http://collector:4318/v1/traces`


### Adjust The OpenTelemetry collector metrics
Install the OTLP metrics exporter used by the current example:
```
npm install @opentelemetry/exporter-metrics-otlp-proto
```

Configure the periodic OTLP metric reader as follows:

```
const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
        url:'http://collector:4318/v1/metrics'
    })
})
meterProvider.addMetricReader(metricReader);
const meter = meterProvider.getMeter('my-service-meter');
```

> make sure to import `import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
`
