# MyServlet Metrics

`MyServlet` 使用 OpenTelemetry API 觀測資料庫請求與 HikariCP connection pool。

## Counters

Counters 用來統計累積事件，只會增加，不代表目前的即時狀態。

| Java field | Metric name | 統計內容 | 增加時機 |
|---|---|---|---|
| `dbAccessCounter` | `app.db.pool.connection_requests` | 從 connection pool 借出 DB connection 的次數 | `dataSource.getConnection()` 成功後 |
| `requestCounter` | `app.db.db_requests` | 成功執行一次資料庫查詢的次數 | Statement 和 ResultSet 建立成功後 |
| `poolCreatedCounter` | `app.db.pool.created` | DB connection pool 被建立的次數 | Servlet 初始化並成功建立 HikariCP pool 後，通常每次啟動一次 |

一次成功的資料庫請求通常會造成：

```text
dbAccessCounter     +1
requestCounter      +1
poolCreatedCounter  不增加
```

## Gauge

| Java field | Metric name | 統計內容 | 取得方式 |
|---|---|---|---|
| `poolAvailableGauge` | `app.db.pool.available` | 目前 connection pool 中可用的 idle connections 數量 | 由 OpenTelemetry callback 讀取 `HikariPoolMXBean.getIdleConnections()` |
| `poolTotalGauge` | `app.db.pool.total` | 目前 pool 中的 connection 總數（active + idle） | 由 OpenTelemetry callback 讀取 `HikariPoolMXBean.getTotalConnections()` |
| `poolActiveGauge` | `app.db.pool.active` | 目前正在使用中的 connections 數量 | 由 OpenTelemetry callback 讀取 `HikariPoolMXBean.getActiveConnections()` |
| `poolMaxGauge` | `app.db.pool.max` | HikariCP 設定的最大 connection 數量 | 由 OpenTelemetry callback 讀取 `HikariDataSource.getMaximumPoolSize()` |

這些 Gauge 不需要手動 `add()` 或 `subtract()`。它們是即時狀態值，OpenTelemetry 收集 metrics 時會呼叫 callback，從 HikariCP 讀取當下數值。

## Metric semantics

```text
poolCreatedCounter  = 建立了幾個 connection pool
dbAccessCounter     = 借用了幾次 DB connection
requestCounter      = 成功執行了幾次 DB request
poolAvailableGauge  = 目前有多少 idle connections 可用
poolTotalGauge      = 目前 pool 中有多少 connections
poolActiveGauge     = 目前有多少 connections 正在使用
poolMaxGauge        = pool 允許的最大 connections 數量
```

## Detecting pool growth

`poolTotalGauge` 可以用來觀察 pool 是否建立了新的 physical connection。例如：

```text
前一次：pool.total = 2
這一次：pool.total = 3
```

表示 pool 的 connection 總數增加了一個。`pool.total` 的上限由 `pool.max` 決定，目前設定為 `10`。`pool.available` 是 idle connections，不等於 pool 的總大小。
