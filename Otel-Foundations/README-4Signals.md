# **Telemetry Signals**

- <https://opentelemetry.io/docs/concepts/signals/>

> Data collected from a system to monitor its behaviour & performance.

- Metrics
- Logs
- Traces
- Baggage
    - 用途：在不同服務與程序之間傳遞共用的業務資訊。
    - 資料格式：Key-Value（鍵值對）。
    - 傳遞方式：透過 Context Propagation，跨服務傳遞資訊。
    - 應用：可將 Baggage 資訊加入 Traces、Metrics 或 Logs。

> 注意： Baggage 本身不是 Telemetry Signal，也不會自動記錄到 Traces、Metrics 或 Logs，必須另外配置或寫入。
---
## **Metrics**

<https://opentelemetry.io/docs/concepts/signals/metrics/>

- **How OpenTelemetry collects metrics**

    - Initialize Meter Provider
    - Meter creates metric instruments which capture measurements
    - Metric exporter sends metrics to a consumer

### **Metrics Collection Architecture**

```
Application
    │
    ▼
Meter Provider
    │
    ▼
Meter
    │
    ├── Metric Instrument
    ├── Metric Instrument
    └── Metric Instrument
              │
              ▼
       Metric Exporter
```

##　Metric Instruments
A metric instrument is defined by:

- Name
- Kind
- Unit (optional)
- Description (optional)

## **OpenTelemetry Metric Kinds**

| Instrument                     | 類型       | 用途／範例                           |
| ------------------------------ | -------- | ------------------------------- |
| **Counter**                    | 同步、只增不減  | 累計 HTTP Requests                |
| **Asynchronous Counter**       | 非同步、只增不減 | 定期讀取累計請求數                       |
| **UpDownCounter**              | 同步、可增可減  | **活躍連線數**                           |
| **Asynchronous UpDownCounter** | 非同步、可增可減 | 定期讀取 Queue Size                 |
| **Gauge**                      | 同步、當前值   | CPU Temperature                 |
| **Asynchronous Gauge**         | 非同步、當前值  | 定期讀取 Memory Usage               |
| **Histogram**                  | 同步、數值分布  | HTTP Request Latency（P95 / P99） |

**重點：**

- **Counter**：只增加。
- **UpDownCounter**：可增加、可減少。
- **Gauge**：記錄當前數值。
- **Histogram**：統計數值分布。
- **Asynchronous**：透過 Callback 定期觀測，而非每次變化都主動記錄。

*註：Histogram 可提供延遲分布資料；P95/P99 通常由後端根據 Histogram 計算。*

---

# Handson code-based Instrumentations

## Java - Metrics

- <https://github.com/brainbsod/hello-telemetry/blob/2-code-based-metrics/java-app/pom.xml>
- <https://mvnrepository.com/artifact/io.opentelemetry/opentelemetry-api>

- Update `pom.xml` and `MyServlet.java`

```bash
cd Otel-Foundations/hello-telemetry/
mvn -f ./java-app/pom.xml clean package

docker compose up --build -d

```

- <http://localhost:8085/MyWebApp/>
- Docker Container <ht-otel-collector> -> Name: app.db.db_requests

---
## Python - Metrics

```bash
cd ../python-service/
pip install -r requirements.txt

cd ..
docker compose up --build -d
```

- <http://localhost:8085/MyWebApp/>
- Docker Container <ht-otel-collector> -> Name: app_compute_request_count

--- 

# Hands-on Metrics - **OpenTelemetry Demo** - Data Analysis

```bash
cd ..
docker compose down

cd ../opentelemetry-demo

docker compose --env-file .env --env-file .env.override \
  -f compose.yaml -f compose.full.yaml \
  -f compose.observability.yaml -f compose.extras.yaml \
  -f compose.agent.yaml  \
  up -d

```
- Prometheus <http://localhost:9092/query> => demo_***
    - demo_ad_requests_total

```text
demo_ad_requests_total
demo_ad_served_total
demo_cart_add_item_latency_seconds_bucket
demo_cart_add_item_latency_seconds_count
demo_cart_add_item_latency_seconds_sum
demo_cart_get_cart_latency_seconds_bucket
demo_cart_get_cart_latency_seconds_count
demo_cart_get_cart_latency_seconds_sum
demo_exchange_conversions_counter_total
demo_notification_confirmations_total
demo_payment_transactions_total
demo_recommendation_requests_total
demo_shipping_items_shipped_total
demo_tool_calls_total
quotes_total
```

- Locust http://localhost:8080/loadgen/ 
    - Locust 是這個 OpenTelemetry Demo 的「流量產生器／負載測試工具」。

- Grafana http://localhost:8080/grafana

- Shopping http://localhost:8080/

- Jaeger http://localhost:8080/jaeger/ui/ or http://localhost:60498/jaeger/ui/

## Start Hello Telemetry
```bash
cd ../hello-telemetry/
docker compose up -d

```

---
# **Traces**

- <https://opentelemetry.io/docs/concepts/signals/traces/>

## **How OpenTelemetry collects traces**

- Initialize Tracer Provider ← Factory of Tracers
- Tracer creates spans
- Trace exporter sends spans to a consumer

### **Span Information**

- Name
- Span Context
- Parent Span ID
- Start and End Timestamps
- Attributes
- Span Events
- Span Links
- Span Status
- Span Kind

### **Traces Collection Architecture**

```
Application
    │
    ▼
Tracer Provider
    │
    ▼
Tracer
    │
    ├── Span 1
    ├── Span 2
    └── Span 3
          │
          ▼
    Trace Exporter
```

---

# Span Information

> OpenTelemetry 將 Span 定義為 Trace 中的一個有時間範圍的操作。[OpenTelemetry Traces 官方文件](https://opentelemetry.io/docs/concepts/signals/traces/)

| Span 資訊 | 實際範例 | 說明 |
|---|---|---|
| **Name** | `POST /api/checkout` | 表示目前執行的操作，例如處理結帳請求。 |
| **Span Context** | `trace_id=4bf92f3577b34da6a3ce929d0e0e4736`<br>`span_id=00f067aa0ba902b7`<br>`trace_flags=01` | 識別目前 Span 並連結整個分散式 Trace。Span Context 通常包含 Trace ID、Span ID、Trace Flags 和 Trace State，且不可修改。 |
| **Parent Span ID** | `parent_span_id=7a1c5e9b2d4f8a10` | 表示哪一個 Span 呼叫了目前的 Span，例如前端 Proxy。 |
| **Start and End Timestamps** | 開始：`2026-11-17T10:15:30.120Z`<br>結束：`2026-11-17T10:15:30.245Z` | 表示結帳操作花費 125 毫秒。 |
| **Attributes** | `http.request.method=POST`<br>`url.path=/api/checkout`<br>`http.response.status_code=200`<br>`order.item_count=2` | 描述操作的鍵值資料。不要記錄密碼、信用卡號等敏感資訊。 |
| **Span Events** | `checkout.validation.completed`<br>`exception: PaymentDeclinedException` | Span 執行期間發生的時間點事件，例如付款失敗或快取未命中。 |
| **Span Links** | 連結至 Kafka 訊息的 Span Context：`trace_id=9f8e7d6c...` | 將目前 Span 連結到另一個沒有直接父子關係的 Span，常用於非同步訊息或批次處理。 |
| **Span Status** | `ERROR`<br>`status.message="Payment was declined"` | 表示操作結果。正式狀態值為 `UNSET`、`OK` 和 `ERROR`。 |
| **Span Kind** | `SERVER` | 表示此服務接收並處理外部傳入的請求。 |

## Span Status

Span Status 用來表示操作結果。正式狀態值為 `UNSET`、`OK` 和 `ERROR`；`UNSET` 不一定代表操作失敗。

| Span Status | 中文 | 實際情境 | 範例 |
|---|---|---|---|
| **`UNSET`** | 未設定 | 沒有明確判定成功或失敗，是 Span 的預設狀態；不一定代表失敗。 | HTTP 請求完成，但程式沒有特別設定 Status。 |
| **`OK`** | 成功 | 明確表示操作成功完成。 | 付款成功、資料庫查詢成功、訂單建立成功。 |
| **`ERROR`** | 錯誤 | 表示操作失敗或發生例外。 | HTTP 500、付款被拒絕、資料庫連線失敗。 |

## Span Kind
一個完整的分散式 Trace 可能如下：

```text
frontend-proxy       SERVER
└── checkout-service SERVER
    ├── payment-api  CLIENT
    └── accounting    PRODUCER
        └── accounting-worker CONSUMER
```

常見的 Span Kind：

- `SERVER`：處理傳入的 HTTP 或 RPC 請求。
- `CLIENT`：呼叫其他服務或外部系統。
- `PRODUCER`：發送訊息，例如 Kafka message。
- `CONSUMER`：接收並處理訊息。
- `INTERNAL`：服務內部的程式操作，沒有遠端邊界。

---

# Context Propagation（追蹤上下文傳遞）

## 1. Span Propagation

```text
Service A                       Service B
Span 1                          Span 2
   │                               ▲
   └──── Context Propagation ──────┘

Same Trace ID
Different Span IDs
Span 2 Parent Span ID = Span 1 Span ID
```

## 2. Span Data

- `Context`
    - **Trace ID**：`trace_id`（整條 Trace 共用）
    - **Span ID**：`span_id`（每個 Span 獨立）
    - **Trace Flags**：`flag_value`（例如 Sampling Flag）
    - **Trace State**：`state_value`（Vendor-specific Trace Context）
- `Parent Span Id` (span_1_id)

## 3. W3C Trace Context（Default）

HTTP Headers：

- `traceparent`：主要 Trace Context Header
- `tracestate`：選用，用於額外的 Trace Context

## 4. W3C traceparent（HTTP Header）

- <https://www.w3.org/TR/trace-context/#trace-context-http-headers-format>

**Format:**

```text
version-trace-id-parent-id-trace-flags
```

**Example:**

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

| Field | Example | Description |
|---|---|---|
| Version | `00` | W3C Trace Context Version |
| Trace ID | `4bf92f3577b34da6a3ce929d0e0e4736` | 整條 Trace 共用 |
| Parent ID | `00f067aa0ba902b7` | 發送端 Span ID |
| Trace Flags | `01` | Sampled Flag |

---

# Hello Telemetry — OpenTelemetry Context Propagation

## 1. Overview

根據 Jaeger Distributed Trace，系統包含兩個 Services：

- **Java Service（ht-tomcat）**
  - `GET`：Root Span
  - `SleepForTwoSeconds`：Child Span
  - `DatabaseConnection`：Child Span
  - `ComputeRequest`：Child Span
- **Python Service（ht-python-service）**
  - `ComputeSpan`：Java `ComputeRequest` 的 Child Span

### Jaeger Trace Summary

| Item | Value |
|---|---|
| Root Service | `ht-tomcat` |
| Root Operation | `GET` |
| Services | 2 |
| Total Spans | 5 |
| Maximum Span Depth | 3 |
| Trace Duration | 2.04 seconds |

以上顯示 Java 和 Python 的 Spans 屬於同一條 Distributed Trace，並建立了跨服務的 Parent-Child Relationship。

## 2. Context Propagation Architecture

```mermaid
flowchart TB
    ROOT["ht-tomcat: GET<br/>Trace ID: T100<br/>Span ID: S0"]

    subgraph JAVA["Java Service — ht-tomcat"]
        direction TB
        S1["SleepForTwoSeconds<br/>Span ID: S1"]
        S2["DatabaseConnection<br/>Span ID: S2"]
        S3["ComputeRequest<br/>Span ID: S3"]
    end

    subgraph PYTHON["Python Service — ht-python-service"]
        S4["ComputeSpan<br/>Span ID: S4"]
    end

    ROOT -->|"Parent Context"| S1
    ROOT -->|"Parent Context"| S2
    ROOT -->|"Parent Context"| S3

    S3 -->|"Cross-Service Context Propagation<br/>Trace ID: T100<br/>Parent ID: S3"| S4

    classDef root fill:#176B52,stroke:#6EE7B7,color:#fff
    classDef java fill:#2563EB,stroke:#93C5FD,color:#fff
    classDef python fill:#9333EA,stroke:#D8B4FE,color:#fff

    class ROOT root
    class S1,S2,S3 java
    class S4 python
```

> `T100`、`S0`～`S4` 為示意 ID。實際 W3C Trace ID 為 32 個十六進位字元，Span ID 為 16 個十六進位字元。

## 3. Span Context and Parent-Child Relationships

| Service | Span | Trace ID | Span ID | Parent Span ID |
|---|---|---|---|---|
| Java | `GET` | T100 | S0 | None |
| Java | `SleepForTwoSeconds` | T100 | S1 | S0 |
| Java | `DatabaseConnection` | T100 | S2 | S0 |
| Java | `ComputeRequest` | T100 | S3 | S0 |
| Python | `ComputeSpan` | T100 | S4 | S3 |

**Key Observations:**

- **Same Trace ID**：所有 Spans 使用同一個 Trace ID（T100）。
- **Unique Span IDs**：每個 Span 都有自己的 Span ID。
- **Java Sibling Spans**：`SleepForTwoSeconds`、`DatabaseConnection` 和 `ComputeRequest` 的 Parent 都是 `GET`。
- **Cross-Service Child Span**：Python 的 `ComputeSpan` 以 Java 的 `ComputeRequest` 作為 Parent。
- **Span Depth = 3**：`GET → ComputeRequest → ComputeSpan`。

> Sibling Spans 不代表一定平行執行。它們也可能依序執行，但具有相同 Parent Span。

## 4. How Does Context Propagation Work?

### 4.1 Within Java Service

Java Service 透過 OpenTelemetry Context 管理目前 Active Span。

當 `GET` 是 Active Span 時，建立：

- `SleepForTwoSeconds`
- `DatabaseConnection`
- `ComputeRequest`

這三個 Spans 都可以繼承 `GET` 的 Context，形成 Parent-Child Relationships。

同一個 Java Process 內通常不需要使用 HTTP Headers 傳遞 Context。

### 4.2 Between Java and Python Services

當 Java `ComputeRequest` 呼叫 Python Service 時：

1. Java 從目前 Active Span 取得 Span Context。
2. OTel Propagator 將 Context 注入 HTTP Request Headers。
3. Python 從 HTTP Headers 提取 Trace Context。
4. Python 使用提取的 Context 建立 `ComputeSpan`。
5. Python `ComputeSpan` 保持相同 Trace ID，但產生新的 Span ID。

**W3C Trace Context 使用：**

- `traceparent`：主要 Trace Context Header。
- `tracestate`：選用 Header，用於附加 Trace Context 資訊。

## 5. W3C traceparent HTTP Header

### Format

```text
version-trace-id-parent-id-trace-flags
```

### Example

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

| Field | Example | Meaning |
|---|---|---|
| Version | `00` | W3C Trace Context Version |
| Trace ID | `4bf92f3577b34da6a3ce929d0e0e4736` | 跨 Java / Python 保持相同 |
| Parent ID | `00f067aa0ba902b7` | 發送端目前 Active Span 的 Span ID |
| Trace Flags | `01` | Sampled Flag |

在本範例中，如果 Java 在 `ComputeRequest` 內直接注入 Context，則 `parent-id` 對應 Java `ComputeRequest` 的 Span ID。

Python 建立 `ComputeSpan` 時，會將這個 ID 作為自己的 Parent Span ID。

> 若 HTTP Auto-Instrumentation 額外建立 HTTP CLIENT / SERVER Spans，實際的 Parent Span ID 可能對應 HTTP CLIENT Span，而不是 `ComputeRequest`。應以 Jaeger 中實際顯示的 Span Hierarchy 與 Span Context 為準。

## 6. Distributed Trace Hierarchy

```mermaid
flowchart TB
    ROOT["ht-tomcat<br/>GET"]

    S1["SleepForTwoSeconds"]
    S2["DatabaseConnection"]
    S3["ComputeRequest"]
    S4["ht-python-service<br/>ComputeSpan"]

    ROOT --> S1
    ROOT --> S2
    ROOT --> S3
    S3 -->|"Context Propagation"| S4

    classDef root fill:#176B52,stroke:#6EE7B7,color:#fff
    classDef java fill:#2563EB,stroke:#93C5FD,color:#fff
    classDef python fill:#9333EA,stroke:#D8B4FE,color:#fff

    class ROOT root
    class S1,S2,S3 java
    class S4 python
```

## 7. Conclusion

OpenTelemetry Context Propagation 讓不同 Services 的 Spans 可以形成同一條 Distributed Trace。

- **Trace ID**：識別整條 Trace。
- **Span ID**：識別個別 Span。
- **Parent Span ID**：建立 Span 之間的 Parent-Child Relationship。
- **Context Propagation**：將 Trace Context 從 Java 傳遞到 Python。
- **Jaeger**：透過 Trace Hierarchy 呈現跨服務呼叫關係。

**本範例的核心結果：**

`Java GET → Java ComputeRequest → Python ComputeSpan`

這條路徑證明 Java 與 Python 的 Spans 已正確關聯在同一條 Distributed Trace。

---


# Hands on Traces and Context Propagation for `Hello Telemetry`

- Update `MyServlet.java`
- Update `compute.py`

```bash
bash build.sh
docker compose up --build -d
```

- http://localhost:16686/api/traces/b0c61326a6c439f752945d866417f08b

```json
{ "traceID": "b0c61326a6c439f752945d866417f08b",
    "spans": [
    {
        "traceID": "b0c61326a6c439f752945d866417f08b",
        "spanID": "a1dd96d7a6fe434c",
        "operationName": "SleepForTwoSeconds",
        "references": [
        {
            "refType": "CHILD_OF",
            "traceID": "b0c61326a6c439f752945d866417f08b",
            "spanID": "d6b2b31b3259dd51"
        }
        ],
        ...
    }
  ]
},
...
{
    "traceID": "b0c61326a6c439f752945d866417f08b",
    "spanID": "964fc27efa08e78d",
    "operationName": "ComputeSpan",
    "references": [
    {
        "refType": "CHILD_OF",
        "traceID": "b0c61326a6c439f752945d866417f08b",
        "spanID": "fdd8834ed68847ca"
    }
    ]
}
```
---

# Logs

- Official Documentation: https://opentelemetry.io/docs/concepts/signals/logs/

## 1. OpenTelemetry Logging Objective

- Support existing logs and logging libraries.
- Integrate logging with OpenTelemetry without replacing existing logging frameworks.
- Standardize log records using the OpenTelemetry Log Data Model.
- Enable correlation between Logs and Traces using Trace ID and Span ID.

## 2. Supported Logging Libraries

| Language | Logging Libraries |
|---|---|
| **Java** | Log4j, SLF4J, Logback |
| **.NET** | Log4net, NLog, Serilog |
| **JavaScript / Node.js** | Log4js, Winston, Pino |
| **Go** | Logrus, Zap |
| **Python** | Logging, Loguru |

**Note:** Integration capabilities and maturity vary by language, library, and OpenTelemetry instrumentation version.

## 3. OpenTelemetry Logging

- Provides **Logs API and SDK**, primarily designed for integration with existing logging libraries.
- **Enhances existing logs with correlation data**, such as Trace ID, Span ID, and Trace Flags.
- Provides capabilities to receive, process, and export log data to a consumer or backend server.
- Supports integration through **Log Appenders / Bridges** without requiring applications to replace existing logging libraries.

### 3.1 Example 1: Original Log

```text
2024-08-08 18:59:25 - oteldemo.AdService - Targeted ad request received for [travel]
```

### 3.2 Example 2: Log with OpenTelemetry Correlation

```text
2024-08-08 18:59:25 - oteldemo.AdService - Targeted ad request received for [travel]
trace_id=f9cc0f59ce50d371ed73ba00b4d2019e
span_id=0fdc4062b3732f51
trace_flags=01
```

**Key Point:** OpenTelemetry enables existing application logs to be correlated with distributed traces using `trace_id` and `span_id`.

**Note:** Trace correlation fields are available when appropriate logging instrumentation or context enrichment is configured. They are not automatically added to every log in every language.

---

## 4. OpenTelemetry Logging Architecture — Log Appender / Bridge

Existing Logging Libraries can integrate with OpenTelemetry through **Log Appenders / Bridges**, allowing log records to follow the OpenTelemetry Logs API / SDK pipeline.

### 4.1 Logging Architecture

```mermaid
flowchart TB
    APP["Application"]
    LIB["Existing Logging Library<br/>Logback / Winston / Python Logging"]

    subgraph OTEL["OpenTelemetry Logs API / SDK"]
        direction TB

        BR["Log Appender / Bridge"]
        LP["LoggerProvider"]
        LG["OTel Logger"]
        LR["OTel LogRecord<br/>Standard Data Model"]
        PROC["LogRecordProcessor"]
        EXP["OTLP LogRecordExporter"]

        LP -->|"Creates"| LG
        BR -->|"Emits via"| LG
        LG --> LR
        LR --> PROC
        PROC --> EXP
    end

    COL["OpenTelemetry Collector"]
    LOKI["Grafana Loki<br/>Log Backend"]
    GRAF["Grafana UI"]

    APP --> LIB
    LIB --> BR
    EXP -->|"OTLP"| COL
    COL -->|"Supported Log Export / OTLP"| LOKI
    LOKI -->|"LogQL Queries"| GRAF

    classDef app fill:#2563EB,stroke:#93C5FD,color:#fff
    classDef bridge fill:#EA580C,stroke:#FDBA74,color:#fff
    classDef sdk fill:#166534,stroke:#86EFAC,color:#fff
    classDef data fill:#7C3AED,stroke:#C4B5FD,color:#fff
    classDef export fill:#0891B2,stroke:#67E8F9,color:#fff

    class APP,LIB app
    class BR bridge
    class LP,LG,PROC sdk
    class LR data
    class EXP,COL,LOKI,GRAF export

    style OTEL fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#166534
```

**Architecture Explanation:**

1. The application generates logs through an existing Logging Library.
2. A Log Appender / Bridge converts or maps existing log records into OpenTelemetry LogRecords.
3. The OpenTelemetry Logger, obtained from a LoggerProvider, emits LogRecords.
4. A LogRecordProcessor processes and optionally batches the records.
5. The LogRecordExporter exports logs using OTLP.
6. The OpenTelemetry Collector receives, processes, and forwards logs.
7. Loki stores and indexes logs, while Grafana provides visualization and querying.

**Important:** The OpenTelemetry Log Data Model defines the structure of LogRecords. It is not a standalone processing component.

### 4.2 Components and Responsibilities

| Component | Responsibility |
|---|---|
| **Logging Library** | Generates application logs, e.g., Logback, Winston. |
| **Log Appender / Bridge** | Integrates existing logging records with the OpenTelemetry Logs API. |
| **LoggerProvider** | Creates and manages OTel Loggers. |
| **Logger** | Emits OTel LogRecords. |
| **OTel LogRecord** | Represents a log using the standard OpenTelemetry Log Data Model. |
| **LogRecordProcessor** | Processes and optionally batches LogRecords before export. |
| **LogRecordExporter** | Exports LogRecords to a Collector or backend. |
| **OTel Collector** | Receives, processes, and forwards log telemetry. |
| **Grafana Loki** | Stores and enables querying of logs. |
| **Grafana UI** | Visualizes logs and correlates them with traces. |

### 4.3 Real-World Java Example

```text
Java Application
    ↓
SLF4J + Logback
    ↓
OpenTelemetry Logback Appender
    ↓
OTel Logger (from LoggerProvider)
    ↓
OTel LogRecord
    ↓
LogRecordProcessor
    ↓
OTLP LogRecordExporter
    ↓
OpenTelemetry Collector
    ↓
Grafana Loki
    ↓
Grafana UI
```

### 4.4 Alternative — Collect Existing Log Files / stdout

OpenTelemetry can also collect existing application logs without requiring an in-process Log Appender / Bridge.

```mermaid
flowchart TB
    APP["Application"]
    LOG["stdout / Log Files"]
    AGENT["Log Collection Agent<br/>e.g., OTel Collector"]
    COL["OTel Collector Pipeline"]
    LOKI["Grafana Loki"]
    GRAF["Grafana UI"]

    APP --> LOG
    LOG --> AGENT
    AGENT --> COL
    COL --> LOKI
    LOKI --> GRAF

    classDef app fill:#2563EB,color:#fff
    classDef collector fill:#0D9488,color:#fff
    classDef backend fill:#7C3AED,color:#fff

    class APP,LOG app
    class AGENT,COL collector
    class LOKI,GRAF backend
```

In this model:

- Existing applications continue writing logs to files or stdout.
- A collection agent reads and forwards the logs.
- The Collector processes the records and exports them to Loki.
- Trace ID and Span ID correlation requires those identifiers to be included in the logs or enriched through an appropriate integration.

**Note:** The collection agent and Collector pipeline may be part of the same Collector deployment. Loki ingestion must use a supported exporter or OTLP endpoint.

---

## 5. Key Differences Between the Two Logging Approaches

| Comparison | Log Appender / Bridge | stdout / File Collection |
|---|---|---|
| Integration Location | Inside Application Runtime | Outside Application |
| Existing Logging Library | Reused | Reused |
| OTel Logs SDK in Application | Usually required | Not required |
| Log Collection | OTel SDK → OTLP | Agent / Collector |
| Trace Correlation | Through Context-aware logging integration | Requires Trace / Span IDs in log content |
| Application Changes | Configuration / dependencies may be required | Often only collection configuration |
| Kubernetes Deployment | Application instrumentation | DaemonSet / Agent / Collector |

## 6. Conclusion

OpenTelemetry provides **Logs API, Logs SDK, Log Appenders / Bridges, and standardized Log Data Models** to integrate existing logging frameworks with observability backends.

Two common approaches are:

**Approach A — Application-level Appender Integration**

`Logging Library → OTel Appender / Bridge → OTel Logs SDK → OTLP Exporter → Collector → Loki → Grafana`

**Approach B — Infrastructure-level Collection**

`Application stdout / Files → Collection Agent → OTel Collector → Loki → Grafana`

**Recommended Principle:** Continue using existing Logging Libraries where appropriate, standardize log data collection and export through OpenTelemetry, and enable correlation between Logs and Traces using Trace ID and Span ID.

---

# Hands on Java Log Appender for Hello Telemetry

- <https://github.com/open-telemetry/opentelemetry-java-examples/tree/main/log-appender>

- Update `pom.xml`
- Create `logback.xml`
- Update `MyServlet.java`

```java
// Logs
// Install SLF4JBridgeHandler to route JUL logs to SLF4J
SLF4JBridgeHandler.removeHandlersForRootLogger();
SLF4JBridgeHandler.install();  
        
// Install OpenTelemetry in logback appender
OpenTelemetryAppender.install(openTelemetry);        

more //Logs ...
```

```bash
bash build.sh
docker compose up --build -d
```

## Logs Architecture

```mermaid
flowchart TB
    APP["MyServlet.java"]

    JUL["java.util.logging"]
    BR["SLF4JBridgeHandler"]
    SLF["SLF4J API"]
    LB["Logback Classic"]

    OAPP["OTel Logback Appender"]
    SDK["OTel Logs SDK<br/>SdkLoggerProvider"]
    PROC["BatchLogRecordProcessor"]
    EXP["OtlpGrpcLogRecordExporter"]
    COL["OTel Collector<br/>ht-otel-collector:4317"]

    APP --> JUL
    JUL --> BR
    BR --> SLF
    SLF --> LB
    LB --> OAPP
    OAPP --> SDK
    SDK --> PROC
    PROC --> EXP
    EXP -->|"OTLP/gRPC"| COL

    classDef logging fill:#2563EB,color:#fff
    classDef bridge fill:#9333EA,color:#fff
    classDef sdk fill:#059669,color:#fff
    classDef collector fill:#EA580C,color:#fff

    class APP,JUL,SLF,LB logging
    class BR,OAPP bridge
    class SDK,PROC,EXP sdk
    class COL collector

```

## Verify Logs

- <http://localhost:8085/MyWebApp/>

```bash
docker logs -f ht-otel-collector 2>&1   | grep -E 'otelcol.signal.*logs|LogRecord|DB Connection'
```

- Docker Desktop `ht-otel-collector` => `LogRecord`

---
# Hands on Python for Hello Telemetry

- <https://github.com/open-telemetry/opentelemetry-python/tree/main/docs/examples/logs>

- Update `requirements.txt` and `compute.py`

```bash
docker compose up --build -d
```

## Verify Logs

- <http://localhost:8085/MyWebApp/>
- Docker Desktop `ht-otel-collector` => `LogRecord` OR `Computed average age`

---

# Hands-on - Zero-code + Code-based Instrumentations - hello-telemetry

## Java
- Update `docker-compose.yaml`, `pom.xml`, and `MyServlet.java`

## Python
- Update `requirements.txt`, and `compute.py`

```bash
bash build.sh
docker compose up --build -d
```
---
