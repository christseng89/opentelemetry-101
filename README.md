# Observability in Cloud Native Apps Using OpenTelemetry

Welcome to the Observability in Cloud Native apps using OpenTelemetry
repository! This repository contains a demo application used throughout the Udemy course. It demonstrates current OpenTelemetry JavaScript instrumentation with a Node.js todo service, an auth service, Redis, an OpenTelemetry Collector, Prometheus, and Jaeger.

## Current runtime and dependency baseline

- Node.js 24 (the Docker images use `node:24-alpine`)
- OpenTelemetry JS SDK 3.1.x and Node SDK 0.301.x
- OpenTelemetry Node auto-instrumentations 0.83.x
- OpenTelemetry Collector Contrib 0.163.2
- Jaeger 2.23.0
- Prometheus 3.9.1
- Redis 7.4-alpine

The SDK 3.x migration removes the old `@opentelemetry/sdk-trace-base` application import, replaces `Resource` construction with `resourceFromAttributes`, and uses the stable semantic attribute constants.

## Directory layout

The project separates application source code from local infrastructure:

```text
opentelemetry-101/
├── app-versions/
│   └── code/                 # TypeScript services, telemetry modules, and Dockerfiles
│       └── telemetry/        # SOLID telemetry runtime, spans, logs, metrics, and tracer APIs
├── java-todo-service/        # Java 21 Spring Boot Todo OpenAPI service with OTel tracing
├── compose/
│   ├── compose.yaml          # Local application and observability stack
│   ├── collector/            # OpenTelemetry Collector configuration
│   ├── grafana/               # Grafana data source provisioning
│   ├── loki/                  # Loki configuration
│   ├── prometheus/            # Prometheus configuration
│   └── tempo/                 # Tempo configuration
└── docs/                     # Learning notes and examples
```

## Following the course code examples

This course is build an a way that we start with a simple application and every section of the course we will add more functionally of OpenTelemetry.

To navigate between the different phases of the course I have used git tags. Below is a table with all the available tags (after you have cloned the repo it is recommended to checkout the first tag)

| Deprecated tag | New tag | Description                              |
| -------------- | ------- | ---------------------------------------- |
| 1              | 1       | Before we install OpenTelemetry          |
| 2              | 2       | Basic OpenTelemetry installation         |
| 3              | 3       | Adding Metrics                           |
| 4              | 4       | Correlating logs with traces             |
| 5              | 5       | Creating manual spans                    |
| 6              | 6       | Adding custom attributes                 |
| 7              | 7       | Debug logs                               |
| 8              | 8       | Define custom resources                  |
| 9              | 9       | Configure custom sampler                 |
| 10             | 10      | Using context propagation to set baggage |
| 11             | 11-v2   | Using the OpenTelemetry Collector        |
| 12             | 12-v2   | Setting up tail sampling                 |

## How to use this repo

1. **Clone the Repository:**

```bash
git clone https://github.com/christseng89/opentelemetry-101.git
cd opentelemetry-101
```

2. **Install dependencies:**

```bash
cd app-versions/code
npm install
```

3. **Check the TypeScript:**

```bash
npm run typecheck
```

Return to the repository root before running Docker Compose:

```bash
cd ../..
```

4. **Run the demo with Docker Compose:**

```bash
docker compose -f compose/compose.yaml up --build -d
```

The services are available at:

- Todo service: [http://localhost:8081/todos](http://localhost:8081/todos)
- Java Todo OpenAPI service: [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- Java Todo OpenAPI JSON: [http://localhost:8082/v3/api-docs](http://localhost:8082/v3/api-docs)
- Prometheus: [http://localhost:9092](http://localhost:9092)
- Jaeger: [http://localhost:16686](http://localhost:16686)
- Tempo API: [http://localhost:3200](http://localhost:3200)
- Loki API: [http://localhost:3110](http://localhost:3110)
- Grafana: [http://localhost:3010](http://localhost:3010)
- Application metrics: available in Prometheus as job `opentelemetry`
- Redis exporter metrics: available in Prometheus as job `redis`

Generate a slow request or an error to exercise tracing:

```bash
curl 'http://localhost:8081/todos?slow=true'
curl 'http://localhost:8081/todos?fail=true'
```

The Todo API returns the active distributed trace ID in the `X-Trace-Id`
response header. Capture it with:

```bash
curl -i 'http://localhost:8081/todos'
```

Use the returned value in Grafana Loki to find all correlated logs:

```logql
{service_name=~"todo-service|java-todo-service"} | trace_id = "<TRACE_ID>"
```

Then open the matching trace in Tempo or Jaeger using the same trace ID. The
trace includes the Node Todo span, the Java `GET /api/todos` span, and the
Java `todo.config.read` span.

Manual application spans also expose the same value as the custom
`telemetry.trace_id` span attribute. The native OpenTelemetry Trace ID remains
the source of truth; this attribute is provided to make the value visible next
to other span attributes in Jaeger and Tempo.

The application sends OTLP traces, logs, and metrics to the Collector over
HTTP. The Collector exports the same traces to both Jaeger and Tempo, accepts
OTLP logs for Loki, and exposes application metrics for Prometheus on port
`8889`. Prometheus is available externally at
[http://localhost:9092](http://localhost:9092).

Grafana is provisioned with Prometheus, Loki, and Tempo data sources. Open
[http://localhost:3010](http://localhost:3010), select **Explore**, and choose
`Loki` or `Tempo`. Jaeger remains available at
[http://localhost:16686](http://localhost:16686) for the same trace stream.

The application telemetry implementation follows a SOLID boundary: the
business services depend on `app-versions/code/telemetry`, while Jaeger,
Tempo, Loki, and Prometheus remain Collector destinations. The same trace is
therefore available in both Jaeger and Tempo without changing business code.

## Compare Jaeger, Tempo, and Loki

Generate telemetry from the Todo service:

```bash
curl 'http://localhost:8081/todos?slow=true'
curl 'http://localhost:8081/todos?fail=true'
```

In Grafana, open [http://localhost:3010](http://localhost:3010), go to
**Explore**, and use:

- `Tempo`: choose service `todo-service` and search for `GET /todos`.
- `Loki`: query `{service_name=~".+"}` and filter by `service_name` or `severity_text`.

The same `GET /todos` trace can also be searched in Jaeger at
[http://localhost:16686](http://localhost:16686). Tempo exposes the trace
search API at:

```bash
curl 'http://localhost:3200/api/search?limit=20'
curl 'http://localhost:3110/loki/api/v1/labels'
```

The application uses the OpenTelemetry Logs API, so error logs include
`trace_id` and `span_id` fields that allow Grafana Tempo and Loki to be
correlated.

Redis auto-instrumentation is enabled for the Node.js `redis` client. The
backend-neutral `CsRedis` interface is defined in
`app-versions/code/telemetry/cs-redis.ts`. The application depends only on
that abstraction; the OpenTelemetry adapters are implemented in
`opentelemetry-redis.ts` and `opentelemetry-ioredis.ts`. Each `GET /todos`
request executes a Redis `PING` through both clients, so the resulting
distributed trace includes `redis-PING` and ioredis `ping` child spans. It also
executes `HSET`, `HGET`, and `HDEL` through both clients, producing the
corresponding Redis command spans. The Collector sends all spans to Jaeger and
Tempo. Redis itself is also monitored
by `redis-exporter`, but the exporter provides Prometheus metrics only; Redis
trace spans come from the instrumented application clients.

To verify the Redis span, generate a request and copy the returned trace ID:

```bash
curl -i 'http://localhost:8081/todos'
```

Search for that trace ID in [Jaeger](http://localhost:16686) or Grafana
Explore with the Tempo data source. The trace should contain a Redis `PING`
spans below the Node Todo request span. This makes it possible to compare the
two client instrumentation implementations while viewing the same trace in
Jaeger and Tempo.

After the Java Todo request completes, the TypeScript service creates a
`java-to-do-completed` span with `peer.service`, `todo.count`, and
`completion.status=completed` attributes. This provides an explicit handoff
point for querying the downstream Java operation in Jaeger or Tempo.

The Todo service creates a manual request span through the shared `CsTracer`
in `app-versions/code/telemetry/cs-tracers.ts`. It includes HTTP and business
attributes such as `http.request.method`, `http.route`, `url.path`, and
`app.operation`. The Collector fans out the same trace to both
Jaeger and Tempo, so no separate application span implementation is required.
In Grafana Tempo, use **Tags** such as `app.operation=list-todos` or
`http.route=/todos`; the same attributes are available in Jaeger.

## Java Todo service and distributed tracing

The `java-todo-service` is a Spring Boot 3 service running on Java 21. It
returns Todo items from the configurable `TODO_DATA_JSON` environment variable
through `GET /api/todos`. The Node.js Todo service calls this endpoint, so one
request creates a distributed trace across Node.js Todo, Java Todo, Auth, and
the Collector.

The Java service uses the OpenTelemetry Java agent for automatic HTTP tracing
and the application uses a backend-neutral telemetry boundary with
`CsLoggers`, `CsTracers`, and `CsSpans`. The current adapter is
`OpenTelemetryTelemetry`; Jaeger and Tempo remain Collector destinations rather
than application-level SDK dependencies. This keeps common logging and tracing
functions reusable when another backend is added later.

The Java source files are named `CsLoggers.java`, `CsTracers.java`, and
`CsSpans.java` (the Java naming-safe equivalents of `cs-loggers.java`,
`cs-tracers.java`, and `cs-spans.java`).

The TypeScript telemetry boundary follows the same SOLID structure with
`cs-loggers.ts`, `cs-tracers.ts`, `cs-spans.ts`, and `cs-telemetry.ts`. The
current `OpenTelemetry*` classes are adapters; Todo and Auth depend only on the
`Cs*` interfaces. A future Jaeger-specific, vendor SDK, or another telemetry
backend can be added as a new adapter without changing business code.

The Java code creates a manual `todo.config.read` span with attributes such as
`app.operation`, `todo.source`, and `todo.count`. Its OTLP exporters point to
the Collector at `http://collector:4318`; traces are sent to both Jaeger and
Tempo, while OpenTelemetry logs are sent through the Collector to Loki.

The Java service randomly returns between 1 and `TODO_MAX_ITEMS` items from
the configured list. The application enforces an absolute maximum of 5 items,
even if the configuration contains 100 or more Todo values. To change the
configured Todo list or the runtime limit, update `TODO_DATA_JSON` and
`TODO_MAX_ITEMS` in `compose/compose.yaml` and recreate the services:

```bash
docker compose -f compose/compose.yaml up -d --build java-todo todo
```

Test the Java API directly:

```bash
curl 'http://localhost:8082/api/todos'
curl 'http://localhost:8082/v3/api-docs'
```

The Java span records `todo.available_count`, `todo.returned_count`,
`todo.max_items`, and `todo.selection=random` so the random behavior can be
verified in Jaeger or Tempo.

## Unit tests

### Java

Run the Java unit tests from the Java service directory:

```bash
cd java-todo-service
mvn test
```

Run a clean test and generate the JaCoCo coverage report:

```bash
mvn clean test
```

The HTML coverage report is generated at:

```text
java-todo-service/target/site/jacoco/index.html
```

### TypeScript

TypeScript currently has no Jest or Vitest unit-test framework configured.
Run the available TypeScript validation from the TypeScript source directory:

```bash
cd app-versions/code
npm install
npm run typecheck
```

`npm run typecheck` validates the TypeScript types but does not execute unit
tests. A TypeScript unit-test framework, such as Vitest or Jest, can be added
later when unit tests are introduced for the service and telemetry modules.

Return to the repository root after running the checks:

```bash
cd ../..
```

Application metrics are exported through OTLP to the Collector. The Collector
exposes them for Prometheus on `collector:8889`, using the `opentelemetry`
scrape job. Prometheus also scrapes operational metrics from Redis through
`redis-exporter:9121`, Jaeger through its internal `jaeger:8888` metrics
endpoint, Tempo through
`tempo:3200`, and Loki through `loki:3100`. The Collector is now responsible
for traces, logs, and metrics.

## Verify Prometheus and query application metrics

Open the Prometheus UI at [http://localhost:9092](http://localhost:9092),
select **Graph**, enter a PromQL query, and click **Execute**.

First verify that the Collector target is healthy:

```promql
up{job="opentelemetry"}
```

Query the Todo service request count:

```promql
http_calls_count{exported_job="todo-service"}
```

Calculate request throughput by HTTP status:

```promql
sum by (status) (
  rate(http_calls_count{exported_job="todo-service"}[5m])
)
```

Calculate average request duration:

```promql
rate(http_calls_sum{exported_job="todo-service"}[5m])
/
rate(http_calls_count{exported_job="todo-service"}[5m])
```

Verify all Prometheus scrape jobs from Bash:

```bash
curl -G 'http://localhost:9092/api/v1/query' \
  --data-urlencode 'query=up'

curl -G 'http://localhost:9092/api/v1/query' \
  --data-urlencode 'query=redis_up'

curl -G 'http://localhost:9092/api/v1/query' \
  --data-urlencode 'query=http_calls_count{exported_job="todo-service"}'
```

The expected `up` jobs are `opentelemetry`, `redis`, `jaeger`, `tempo`, and
`loki`. Jaeger operational metrics are available through
`jaeger_storage_requests`; Tempo and Loki expose `tempo_build_info` and
`loki_build_info`.

Query application metrics in the Prometheus UI with:

```promql
http_calls_count{exported_job="todo-service"}
sum by (status) (
  rate(http_calls_count{exported_job="todo-service"}[5m])
)
```

For this local comparison environment, the Collector also enables the
`local_demo_all_traces` tail-sampling policy so ordinary requests are visible
in both Jaeger and Tempo. A production deployment should remove that policy
or replace it with a cost-controlled sampling rule.

> The best way to learn is by experimenting and modifying the code. Try tweaking the code to understand how different configurations and scenarios affect the telemetry data.

## Feedback and Contributions

Your feedback to this repository are highly appreciated! If you encounter any issues or have ideas to improve it, please feel free to open an issue or submit a pull request. Let's make this learning resource better together!

## Acknowledgments

Special thanks to all the contributors who have helped create and improve these code examples. Your dedication to sharing knowledge and helping others learn is invaluable.

Happy learning!

*Chris Tseng*
