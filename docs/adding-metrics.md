# Adding metrics

### Install OpenTelemetry libraries
```
npm install @opentelemetry/sdk-metrics @opentelemetry/exporter-metrics-otlp-proto
```

### Creating Prometheus config file
Create `prometheus` folder

In it create a `prometheus.yml` file

Enter the following content to the newly created file

```
global:
  scrape_interval: 1s # Bad!! just for demo

scrape_configs:
  - job_name: 'opentelemetry'
    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.
    static_configs:
    - targets: ['collector:8889']
```


### Running Prometheus

```
  prometheus:
    image: prom/prometheus:v3.9.1
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - 9090:9090
```


### Configure the OpenTelemetry meter

The current example exports application metrics to the Collector over OTLP.
Configure the SDK with a periodic OTLP metric reader in `tracer.ts`:

```
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { metrics } from '@opentelemetry/api';

```

Add the following to the `NodeSDK` configuration:
```
    metricReaders: [new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: 'http://collector:4318/v1/metrics',
        }),
    })],
```

After `sdk.start()`, obtain a meter with
`metrics.getMeter(`${serviceName}.meter`)`.

### Report metrics 
Get the meter from the tracer import `const meter = start('todo-service');`


Then, and the following: 


```
const calls = meter.createHistogram('http-calls');

app.use((req,res,next)=>{
    const startTime = Date.now();
    req.on('end',()=>{
        const endTime = Date.now();
        calls.record(endTime-startTime,{
            route: req.route?.path,
            status: res.statusCode,
            method: req.method
        })
    })
    next();
})
```
