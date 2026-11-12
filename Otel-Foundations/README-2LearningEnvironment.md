# Learning Environment

- Setup Learning Environment
- hello-telemetry App
- OpenTelemetry Astronomy Shop Demo App

---

# Setup Learning Environment

- **Minimum Hardware:**
    - 4 vCPU & 12 GB RAM (Recommended)
- Install Visual Studio Code
- Install Docker Desktop
- Install Open-JDK and Apache Maven
- Install Python
- Install Git
- Download hello-telemetry App <https://github.com/brainbsod/hello-telemetry>
- Download OpenTelemetry Demo App <https://github.com/open-telemetry/opentelemetry-demo>
- Visual Studio Code - Extensions (from Microsoft)
    - Python
    - Docker
    - Maven
    - Optional GitHub Copilot Chat (GitHub)

```bash
docker --version
java --version
mvn --version
python --version

cd Otel-Foundations
git clone https://github.com/brainbsod/hello-telemetry.git
git clone https://github.com/open-telemetry/opentelemetry-demo.git
```

---

# Hello Telemetry

```mermaid

flowchart TD
    subgraph APP["hello-telemetry"]
        direction LR

        A["☕ 🐱<br/><b>Java Web App</b><br/>Java + Apache Tomcat"]
        B["🐬<br/><b>MySQL</b><br/>Database"]
        C["🐍<br/><b>Python-Service</b>"]

        A --> B
        A --> C
    end

    D["🔭<br/><b>OpenTelemetry</b><br/>Collector"]
    E["🔎<br/><b>Jaeger</b><br/>Distributed Tracing"]

    B -.->|"OTLP Traces"| D
    C -.->|"OTLP Traces"| D
    A -.->|"OTLP Traces"| D

    D -->|"Traces"| E

    classDef java fill:#E76F32,color:#FFFFFF,stroke:#C2410C,stroke-width:2px
    classDef mysql fill:#0369A1,color:#FFFFFF,stroke:#075985,stroke-width:2px
    classDef python fill:#306998,color:#FFFFFF,stroke:#FFD43B,stroke-width:2px
    classDef collector fill:#4EA72E,color:#FFFFFF,stroke:#347A22,stroke-width:2px
    classDef jaeger fill:#E5E7EB,color:#111827,stroke:#94A3B8,stroke-width:2px

    class A java
    class B mysql
    class C python
    class D collector
    class E jaeger

    style APP fill:#171717,stroke:#64748B,stroke-width:1px,color:#FFFFFF

```

## Testing Hello Telemetry

Start the learning environment from the `Otel-Foundations` directory:

```bash
cd Otel-Foundations/hello-telemetry/

bash build.sh 
docker compose up --build -d
docker compose ps
```

The published host ports are:

- Python service: `5001` (container port `5000`)
- Tomcat web application: `8085` (container port `8080`)
- Jaeger UI: `16686`

Test the Tomcat application:

```bash
curl -i http://localhost:8085/MyWebApp/
curl -i http://localhost:8085/MyWebApp/results
```

Both requests should return HTTP `200`. The `/results` response should display the database rows and an average age, for example `30.3`. This request exercises the Hello Telemetry application and its database-backed flow.

```bash
for i in {1..10}; do
  curl -sS -o /dev/null -w "Request $i: HTTP %{http_code}\n" \
    http://localhost:8085/MyWebApp/results
done
```

Open [Jaeger](http://localhost:16686), search for the configured Tomcat service `ht-tomcat`, and inspect the generated trace.

### Direct Python service test

```bash
curl -i -X POST http://localhost:5001/compute_average_age \
  -H "Content-Type: application/json" \
  -d '{"data":[{"age":20},{"age":30},{"age":40}]}'
```

Expected response:

```json
{"average_age":30.0}
```

Generate additional telemetry:

```bash
for i in {1..10}; do
  curl -sS -o /dev/null -w "Request $i: HTTP %{http_code}\n" \
    -X POST http://localhost:5001/compute_average_age \
    -H "Content-Type: application/json" \
    -d '{"data":[{"age":20},{"age":30},{"age":40}]}'
done
```

Open [Jaeger](http://localhost:16686), search for the configured Tomcat service `ht-python-service`, and inspect the generated trace.

To stop the environment:

```bash
docker compose down
```

## Architecture

- Docker Compose 會將 init.sql 掛載到 MySQL 的初始化目錄，MySQL 首次建立資料庫時執行它，用來建立資料庫、資料表與初始資料。
- Java/Tomcat 應用程式執行 JDBC 查詢時，OpenTelemetry Java Agent 會觀測這些資料庫操作。
- Python service 負責計算平均年齡（average age），並透過 OpenTelemetry 產生 trace/span。

> 注意：只有在 mysql_data volume 為空、第一次初始化時才會自動執行。

```text
Service & Operation

ht-tomcat  GET /MyWebApp/results
└─ ht-tomcat  SELECT mydatabase.mytable
   └─ ht-tomcat  POST
      └─ ht-python-service  POST /compute_average_age

```

```mermaid

flowchart TD
    client["HTTP Client"]

    subgraph JVM["Java Virtual Machine (JVM)"]
        direction TB
        http["Handle HTTP<br/>Requests"]
        code["Custom Code"]
        dbconn["Database<br/>Connection"]

        http -->|dispatch| code
        code -->|query / update| dbconn
        code -->|response| http
    end

    subgraph PY["Python-Service"]
        direction LR
        library["library"]
        pycode["Custom<br/>code"]

        library <--> pycode
    end

    db[("Database")]
    docker["Docker"]

    client -->|HTTP request| http
    http -->|HTTP response| client

    dbconn <-->|read / write| db
    library <-->|HTTP / service calls| http

    JVM -.->|runs in| docker
    PY -.->|runs in| docker
    db -.->|runs in| docker

    classDef service fill:#a62a94,stroke:#d9e5ee,stroke-width:2px,color:#fff
    classDef code fill:#102b49,stroke:#d9e5ee,stroke-width:2px,color:#fff
    classDef runtime fill:#176481,stroke:#143d51,stroke-width:2px,color:#fff
    classDef infra fill:#2488dc,stroke:#2349a5,stroke-width:2px,color:#fff

    class http,library,dbconn service
    class code,pycode code
    class JVM,PY runtime
    class db,docker infra

    linkStyle default stroke:#FFFFFF,stroke-width:3px,color:#FFFFFF


```
---

## Hello Telemetry Summary

- **MySQL**
  - MySQL runs as `ht-mysql`.
  - `init.sql` is mounted through `/docker-entrypoint-initdb.d`.
  - It creates the database, tables, and initial data only when `mysql_data` is initialized for the first time.

- **Java/Tomcat**
  - Runs as `ht-tomcat`.
  - The WAR file is copied into Tomcat.
  - The OpenTelemetry Java Agent provides **Auto Instrumentation** for:
    - HTTP/Servlet requests
    - **JDBC/MySQL queries**
    - HTTP calls to the Python service
  - `MyServlet.java` does not contain Manual Instrumentation.

- **Python service**
  - Runs as `ht-python-service`.
  - Receives database records and calculates the average age.
  - The Python code shown has no Manual Instrumentation.
  - It uses Auto Instrumentation only if its Dockerfile starts the service with `opentelemetry-instrument`.

- **OpenTelemetry Collector**
  - Receives OTLP traces on port `4317` or `4318`.
  - Exports telemetry according to `otel-collector-config.yaml`.

- **Jaeger**
  - Displays traces through the Jaeger UI.

Overall flow:

```text
Client
  → Java/Tomcat
  → MySQL query
  → Python average-age service
  → OpenTelemetry Collector
  → Jaeger
```

Important issues to improve:

- `depends_on` controls startup order but not service readiness.
- Java should close JDBC resources with try-with-resources.
- Java should handle Python’s HTTP `400` response when no data exists.
- Python should validate missing or invalid JSON safely.
- The MySQL credentials are hard-coded and should be externalized for production.

---

# OpenTelemetry Demo

- <https://opentelemetry.io/docs/demo/>
- <https://opentelemetry.io/docs/demo/docker-deployment/>
- <https://github.com/open-telemetry/opentelemetry-demo>

## Start the demo

```bash
cd ../opentelemetry-demo/

docker compose --env-file .env --env-file .env.override \
  -f compose.yaml -f compose.full.yaml \
  -f compose.observability.yaml -f compose.extras.yaml \
   -f compose.agent.yaml  -f compose.profiling.yaml \
  up --force-recreate --remove-orphans --detach

```

## Verify the Web Store and Telemetry

Once the images are built and containers are started, you can access:

- **Web store:** http://localhost:8080/
- **Load Generator UI:** http://localhost:8080/loadgen/
- **Flagd configurator UI:** http://localhost:8080/eature
- **Telemetry documentation (generated by Weaver):** http://localhost:8080/telemetry/

## Observability Stack

The following are available when the observability stack is running (i.e., not in `*-no-o11y` modes):

- **Grafana:** http://localhost:8080/grafana/
- **Jaeger UI:** http://localhost:8080/jaeger/ui/
- **OpAMP UI:** http://localhost:8080/opamp/
- **Chatbot (agentic mode):** http://localhost:8080/chatbot/

> Due to a known Jaeger issue, Grafana’s Jaeger search functionality is not working. However, retrieving a trace by its trace ID works correctly.

---

# Opentelemetry DEMO http://localhost:8080/ Shop Demo 使用 Kafka 的流程

```mermaid
sequenceDiagram
    autonumber

    actor User as 使用者
    participant Proxy as Frontend Proxy<br/>localhost:8080
    participant Frontend as Frontend Service
    participant Checkout as Checkout Service
    participant Kafka as Kafka Broker<br/>kafka:9092
    participant Accounting as Accounting Consumer
    participant Fraud as Fraud Detection Consumer

    User->>Proxy: 瀏覽商店首頁 /
    Proxy->>Frontend: HTTP GET /
    Frontend-->>Proxy: 商品頁面
    Proxy-->>User: 顯示商品頁面

    User->>Proxy: 查詢商品
    Proxy->>Frontend: GET /api/products
    Frontend-->>Proxy: 商品資料
    Proxy-->>User: 顯示商品

    User->>Proxy: 加入購物車
    Proxy->>Frontend: POST /api/cart
    Frontend-->>Proxy: 更新購物車
    Proxy-->>User: 顯示購物車

    User->>Proxy: 進行結帳
    Proxy->>Checkout: POST /checkout
    Checkout->>Checkout: 建立訂單

    Checkout->>Kafka: 發送訂單事件<br/>topic: orders
    Kafka-->>Checkout: 確認訊息已寫入

    Checkout-->>Proxy: 結帳成功
    Proxy-->>User: 顯示訂單完成

    par Accounting 非同步處理
        Kafka-->>Accounting: 消費 orders 訊息
        Accounting->>Accounting: 記錄訂單 / 產生會計資料
    and Fraud Detection 非同步處理
        Kafka-->>Fraud: 消費 orders 訊息
        Fraud->>Fraud: 執行詐欺偵測
    end
```

## Demo Application

```mermaid
flowchart LR
    subgraph Demo["Demo Application"]
        direction LR

        subgraph Lane1[" "]
            direction TB
            Image["Image Provider<br/>Service"]
            Accounting["Accounting<br/>Service"]
            Ad["Ad Service"]
            Cart["Cart Service"]
            Checkout["Checkout Service"]
            Currency["Currency Service"]
        end

        subgraph Lane2[" "]
            direction TB
            Kafka["Kafka"]
            Loadgen["Load Generator"]
            Payment["Payment Service"]
            Product["Product Catalog<br/>Service"]
            Quote["Quote Service"]
            Email["Email Service"]
        end

        subgraph Lane3[" "]
            direction TB
            Fraud["Fraud Detection<br/>Service"]
            Frontend["Frontend"]
            Proxy["Frontend Proxy"]
            Recommendation["Recommendation<br/>Service"]
            Shipping["Shipping Service"]
            Valkey["Valkey Cart"]
        end
    end

    Flagd["Flagd"]
    Collector["OTel Collector"]

    subgraph Monitoring["Monitoring / Observability Solutions"]
        direction TB
        Prometheus["Prometheus<br/>(Metrics)"]
        Jaeger["Jaeger<br/>(Traces)"]
        OpenSearch["OpenSearch<br/>(Logs)"]
    end

    Grafana["Grafana<br/>(Dashboards)"]

    Demo --> Collector
    Flagd --> Demo

    Collector --> Prometheus
    Collector --> Jaeger
    Collector --> OpenSearch

    Prometheus --> Grafana
    Jaeger --> Grafana
    OpenSearch --> Grafana

    classDef app fill:#12658A,stroke:#0A3D55,color:#FFFFFF,stroke-width:2px;
    classDef collector fill:#147A21,stroke:#0B4D13,color:#FFFFFF,stroke-width:2px;
    classDef flagd fill:#A523A0,stroke:#6B1769,color:#FFFFFF,stroke-width:2px;
    classDef observability fill:#777777,stroke:#24475A,color:#FFFFFF,stroke-width:2px;

    class Image,Accounting,Ad,Cart,Checkout,Currency app;
    class Kafka,Loadgen,Payment,Product,Quote,Email app;
    class Fraud,Frontend,Proxy,Recommendation,Shipping,Valkey app;
    class Collector collector;
    class Flagd flagd;
    class Prometheus,Jaeger,OpenSearch,Grafana observability;

    %% 隱藏 lane 外框與標題
    style Lane1 fill:transparent,stroke:transparent,color:transparent
    style Lane2 fill:transparent,stroke:transparent,color:transparent
    style Lane3 fill:transparent,stroke:transparent,color:transparent

    %% 隱藏內部 lane 的自動邊框
    style Demo fill:transparent,stroke:#DDDDDD,stroke-width:1px
```

對應關係：

- 藍色：Demo Application services
- 紫色：Flagd
- 綠色：OpenTelemetry Collector
- 灰色：Prometheus、Jaeger、OpenSearch、Grafana
- 橘色箭頭：Telemetry data flow

## Technologies

| 類別 | 數量 | 項目 |
|---|---:|---|
| 程式語言 | 10 | .NET、C++、Go、Java、JavaScript、Kotlin、PHP、Python、Ruby、Rust |
| 技術 | 4 | Envoy、Nginx、Kafka、Valkey |
| 通訊協定 | 3 | HTTP、gRPC、TCP |

## Kafka

| Service | Span / Operation | Kafka 動作 |
|---|---|---|
| `checkout` | `publish orders` | Publish / Producer |
| `accounting` | `order-consumed` | Consume / Consumer |
| `fraud-detection` | Kafka consumer operation | Consume / Consumer |

簡化流程：

```text
checkout
  └─ publish orders       Producer

accounting
  └─ order-consumed       Consumer

fraud-detection
  └─ Kafka consumer       Consumer
```

---

# OpenTelemetry Demo 通过 `http://localhost:8080` 暴露瀏覽器的 URL

| URL | 说明 |
|---|---|
| [http://localhost:8080/](http://localhost:8080/) | Astronomy Shop Web Store 主页面 |
| [http://localhost:8080/loadgen/](http://localhost:8080/loadgen/) | Locust Load Generator 控制台，可查看和产生负载 |
| [http://localhost:8080/feature](http://localhost:8080/feature) | Flagd UI，管理 Feature Flags |
| [http://localhost:8080/telemetry/](http://localhost:8080/telemetry/) | Telemetry Documentation，查看生成的遥测文档 |
| [http://localhost:8080/grafana/](http://localhost:8080/grafana/) | Grafana Dashboard、Explore、Metrics、Logs、Traces |
| [http://localhost:8080/jaeger/ui/](http://localhost:8080/jaeger/ui/) | Jaeger Trace Search 与 Trace Detail |
| [http://localhost:8080/opamp/](http://localhost:8080/opamp/) | OpAMP Server UI，查看 Collector 管理状态 |
| [http://localhost:8080/chatbot/](http://localhost:8080/chatbot/) | Astronomy Shop Chatbot / Agentic Demo |
| [http://localhost:8080/profiles/](http://localhost:8080/profiles/) | Firepit Profiles UI，用于 Profiling 数据 |


此外，以下路径会被转发到 Web Store 前端：

```text
http://localhost:8080/api/...
```

例如：

```text
http://localhost:8080/api/products
http://localhost:8080/api/cart
http://localhost:8080/api/currency
```

注意：README 中的 `/eature` 是拼写错误，正确路径是：

```text
http://localhost:8080/feature
```

Grafana、Jaeger、OpAMP、Chatbot 和 Profiles 需要使用包含 observability/agent 相关 Compose 文件的完整启动方式。

---

# 手工埋點

| 服務 | 程式碼位置 | 手動建立 span 的程式碼 | Span 名稱 |
|---|---|---|---|
| Payment | [charge.js:28](Otel-Foundations/opentelemetry-demo/src/payment/charge.js:28) | `tracer.startSpan('charge')` | `charge` |
| Ad | [AdService.java:278](Otel-Foundations/opentelemetry-demo/src/ad/src/main/java/oteldemo/AdService.java:278) | `tracer.spanBuilder("getRandomAds").startSpan()` | `getRandomAds` |
| Recommendation | [RecommendationService.java:93](Otel-Foundations/opentelemetry-demo/src/recommendation/src/main/java/oteldemo/recommendation/RecommendationService.java:93) | `tracer.spanBuilder("get_product_list").startSpan()` | `get_product_list` |
| Quote | [routes.php:19](Otel-Foundations/opentelemetry-demo/src/quote/app/routes.php:19) | `spanBuilder('calculate-quote')->startSpan()` | `calculate-quote` |
| Email | [email_server.rb:64](Otel-Foundations/opentelemetry-demo/src/email/email_server.rb:64) | `tracer.in_span("send_email")` | `send_email` |
| Load Generator | [locustfile.py:151](Otel-Foundations/opentelemetry-demo/src/load-generator/locustfile.py:151) | `start_as_current_span(...)` | `user_index` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_browse_product` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_get_recommendations` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_get_ads` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_view_cart` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_add_to_cart` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_checkout_single` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_checkout_multi` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_flood_home` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_ask_agent` |
| Load Generator | 同上 | `start_as_current_span(...)` | `user_session_start` |
| Load Generator | 同上 | `start_as_current_span(...)` | `browser_change_currency` |
| Load Generator | 同上 | `start_as_current_span(...)` | `browser_add_to_cart` |

結論：清單內容正確，共 18 個手動 span 定義。實際是否產生 span，仍取決於該程式流程是否被執行以及目前的 trace sampling 設定。

## 手動建立 span 的 API

| API | 語言 | Demo 中的使用方式 | 說明 |
|---|---|---|---|
| `tracer.startSpan()` | JavaScript | `tracer.startSpan('charge')` | 建立 span，通常需要呼叫 `span.end()` |
| `tracer.spanBuilder(...).startSpan()` | Java | `tracer.spanBuilder("getRandomAds").startSpan()` | 建立 Java span |
| `spanBuilder(...)->startSpan()` | PHP | `spanBuilder('calculate-quote')->startSpan()` | 建立 PHP span |
| `tracer.in_span()` | Ruby | `tracer.in_span("send_email")` | 區塊結束時自動結束 span |
| `tracer.start_as_current_span()` | Python | `start_as_current_span("user_index")` | `with` 區塊結束時自動結束 span |

其他說明：

- 🌐 地球：HTTP span
- ↔️ 雙向箭頭：gRPC/RPC span
- ● 棕色圓點：Internal span，不代表一定是手動建立
- 🛢️ 圓柱：Database/Redis span
- `setAttribute()`、`recordException()`、`setStatus()`、`addEvent()`：補充或修改既有 span
- `Span.current()`：取得目前的 active span，不會建立新 span，也不會自行修改 span

---
