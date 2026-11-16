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