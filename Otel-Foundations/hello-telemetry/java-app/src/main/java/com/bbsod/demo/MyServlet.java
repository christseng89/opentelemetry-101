package com.bbsod.demo;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;

// OpenTelemetry SDK
// Zero code instrumentation
// import io.opentelemetry.sdk.OpenTelemetrySdk;
// import io.opentelemetry.sdk.metrics.SdkMeterProvider;
// import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
// import io.opentelemetry.sdk.resources.Resource;
// import io.opentelemetry.sdk.trace.SdkTracerProvider;
// import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import io.opentelemetry.api.GlobalOpenTelemetry;
// OpenTelemetry API
import io.opentelemetry.api.OpenTelemetry;
// Zero code instrumentation
// import io.opentelemetry.api.common.AttributeKey;
// import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
// Zero code instrumentation
// import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
// import io.opentelemetry.context.propagation.TextMapPropagator;

// Zero code instrumentation
// import io.opentelemetry.exporter.otlp.metrics.OtlpGrpcMetricExporter;
// import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;

// Logs
import java.util.logging.Logger;
// Zero code instrumentation
// import io.opentelemetry.sdk.logs.SdkLoggerProvider;
// import io.opentelemetry.sdk.logs.export.BatchLogRecordProcessor;
// import io.opentelemetry.exporter.otlp.logs.OtlpGrpcLogRecordExporter;
import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender;
import org.slf4j.bridge.SLF4JBridgeHandler;

public class MyServlet extends HttpServlet {

        // Code based instrumentation - Metrics
        private static final String INSTRUMENTATION_NAME = MyServlet.class.getName();
        private final LongCounter requestCounter;
        // Code based instrumentation - Traces
        private final Tracer tracer;
        // Logs
        private static final java.util.logging.Logger julLogger = Logger.getLogger("jul-logger");

        // Constructor
        public MyServlet() {
                // Code based instrumentation - Metrics
                // OpenTelemetry openTelemetry = initOpenTelemetry();
                // Zero code instrumentation supplies the SDK and exporter through the Java agent.
                OpenTelemetry openTelemetry = GlobalOpenTelemetry.get();
                Meter meter = openTelemetry.getMeter(INSTRUMENTATION_NAME);
                this.requestCounter = meter.counterBuilder("app.db.db_requests")
                                .setDescription("Count DB requests")
                                .build();
                // Code based instrumentation - Traces
                this.tracer = openTelemetry.getTracer(INSTRUMENTATION_NAME);

                // Logs
                // Install SLF4JBridgeHandler to route JUL logs to SLF4J
                SLF4JBridgeHandler.removeHandlersForRootLogger();
                SLF4JBridgeHandler.install();

                // Install OpenTelemetry in logback appender
                OpenTelemetryAppender.install(openTelemetry);

        }

        // Zero code instrumentation
        // // Code based instrumentation - Metrics
        // static OpenTelemetry initOpenTelemetry() {

        // // Set up the resource with service.name
        // Resource resource =
        // Resource.create(Attributes.of(AttributeKey.stringKey("service.name"),
        // "ht-tomcat"));

        // // Metrics
        // OtlpGrpcMetricExporter otlpGrpcMetricExporter =
        // OtlpGrpcMetricExporter.builder()
        // .setEndpoint("http://ht-otel-collector:4317")
        // .build();

        // PeriodicMetricReader periodicMetricReader =
        // PeriodicMetricReader.builder(otlpGrpcMetricExporter)
        // .setInterval(java.time.Duration.ofSeconds(20))
        // .build();

        // SdkMeterProvider sdkMeterProvider = SdkMeterProvider.builder()
        // .setResource(resource)
        // .registerMetricReader(periodicMetricReader)
        // .build();

        // // Traces
        // OtlpGrpcSpanExporter otlpGrpcSpanExporter = OtlpGrpcSpanExporter.builder()
        // .setEndpoint("http://ht-otel-collector:4317")
        // .build();

        // SimpleSpanProcessor simpleSpanProcessor =
        // SimpleSpanProcessor.builder(otlpGrpcSpanExporter).build();

        // SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
        // .setResource(resource)
        // .addSpanProcessor(simpleSpanProcessor)
        // .build();

        // // Logs
        // OtlpGrpcLogRecordExporter otlpGrpcLogRecordExporter =
        // OtlpGrpcLogRecordExporter.builder()
        // .setEndpoint("http://ht-otel-collector:4317")
        // .build();

        // BatchLogRecordProcessor batchLogRecordProcessor =
        // BatchLogRecordProcessor.builder(otlpGrpcLogRecordExporter)
        // .build();

        // SdkLoggerProvider loggerProvider = SdkLoggerProvider.builder()
        // .setResource(resource)
        // .addLogRecordProcessor(batchLogRecordProcessor)
        // .build();

        // OpenTelemetrySdk sdk = OpenTelemetrySdk.builder()
        // .setMeterProvider(sdkMeterProvider)
        // // Code based instrumentation - Traces
        // .setTracerProvider(tracerProvider)
        // // Logs
        // .setLoggerProvider(loggerProvider)
        // .build();

        // // Cleanup
        // Runtime.getRuntime().addShutdownHook(new Thread(sdk::close));

        // return sdk;

        // }

        @Override
        protected void doGet(HttpServletRequest request, HttpServletResponse response)
                        throws ServletException, IOException {

                List<JSONObject> dataList = new ArrayList<>();
                PrintWriter out = response.getWriter();
                response.setContentType("text/html");

                // Code based instrumentation - Context Propagation
                // Zero code instrumentation
                // Span parentSpan = tracer.spanBuilder("GET")
                // .setNoParent()
                // .startSpan();
                // parentSpan.makeCurrent();

                // Context parentContext = Context.current().with(parentSpan);
                // The Java agent's servlet span is already the current parent.
                Context parentContext = Context.current();

                // Code based instrumentation - Traces
                // Span to capture sleep
                Span sleepSpan = tracer.spanBuilder("SleepForTwoSeconds")
                                .setSpanKind(SpanKind.INTERNAL)
                                // Context propagation - set the parent context for the sleep span
                                .setParent(parentContext)
                                .startSpan();
                // Sleep for 2 seconds
                try {
                        Thread.sleep(2000);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                        // Code based instrumentation - Traces
                } finally {
                        sleepSpan.end();
                }

                // Start Database Span
                Span dbSpan = tracer.spanBuilder("DatabaseConnection")
                                .setSpanKind(SpanKind.CLIENT)
                                // Context propagation - set the parent context for the database span
                                .setParent(parentContext)
                                .startSpan();
                // Code based instrumentation - Traces end

                // JDBC connection parameters
                String jdbcUrl = "jdbc:mysql://ht-mysql:3306/mydatabase";
                String jdbcUser = "myuser";
                String jdbcPassword = "mypassword";

                try {
                        // Logs
                        julLogger.info("DB Connection initiated");
                        // Load MySQL JDBC Driver
                        Class.forName("com.mysql.cj.jdbc.Driver");

                        // Establish connection
                        Connection connection = DriverManager.getConnection(jdbcUrl, jdbcUser,
                                        jdbcPassword);

                        // Create a statement
                        Statement statement = connection.createStatement();

                        // Execute a query
                        String query = "SELECT * FROM mytable";
                        ResultSet resultSet = statement.executeQuery(query);

                        // Code based instrumentation - Metrics
                        requestCounter.add(1);

                        // Build web page
                        out.println("<html><body>");
                        out.println("<h1>Database Results</h1>");
                        out.println("<table border='1'>");
                        out.println("<tr><th>ID</th><th>Name</th><th>Age</th></tr>");

                        while (resultSet.next()) {
                                int id = resultSet.getInt("id");
                                String name = resultSet.getString("name");
                                int age = resultSet.getInt("age");
                                out.println("<tr><td>" + id + "</td><td>" + name + "</td><td>" + age
                                                + "</td></tr>");

                                JSONObject dataObject = new JSONObject();
                                dataObject.put("id", id);
                                dataObject.put("name", name);
                                dataObject.put("age", age);
                                dataList.add(dataObject);

                        }
                        out.println("</table>");
                } catch (ClassNotFoundException e) {
                        // Logs
                        julLogger.severe("MySQL JDBC Driver not found.");
                        // System.out.println("MySQL JDBC Driver not found.");
                        e.printStackTrace();
                } catch (SQLException e) {
                        // Logs
                        julLogger.severe("Database connection failed.");
                        // System.out.println("Connection failed.");
                        e.printStackTrace();
                } catch (Exception e) {
                        // Logs
                        julLogger.severe("An error occurred: " + e.getMessage());
                        // System.out.println("An error occurred: " + e.getMessage());
                        e.printStackTrace();
                        out.println("<h2>Error: " + e.getMessage() + "</h2>");
                        // Code based instrumentation - Traces
                } finally {
                        dbSpan.end();
                }
                // parentSpan.end();
                // Code based instrumentation - Traces end

                // Make a request to the Python microservice
                // Code based instrumentation - Traces
                String averageAge = getAverageAge(dataList, parentContext);
                out.println("<h2>Average Age: " + averageAge + "</h2>");
                out.println("</body></html>");
                // Logs
                julLogger.info("Response sent to client");

        }

        private String getAverageAge(List<JSONObject> dataList, Context parentContext) throws IOException {

                Span computeSpan = tracer.spanBuilder("ComputeRequest")
                                .setSpanKind(SpanKind.CLIENT)
                                // Context propagation - set the parent context for the compute span
                                .setParent(parentContext)
                                .startSpan();

                // Code based instrumentation - Context Propagation to the Python microservice
                // Context context = Context.current().with(computeSpan);

                try (Scope scope = computeSpan.makeCurrent();
                                // Code based instrumentation - Traces end
                                CloseableHttpClient httpClient = HttpClients.createDefault()) {
                        // Logs
                        julLogger.info("Request to Python microservice");
                        HttpPost httpPost = new HttpPost("http://ht-python-service:5000/compute_average_age");
                        httpPost.setHeader("Content-Type", "application/json");

                        JSONObject requestData = new JSONObject();
                        requestData.put("data", new JSONArray(dataList));

                        StringEntity entity = new StringEntity(requestData.toString());
                        httpPost.setEntity(entity);

                        // Inject the context into the HTTP request headers using
                        // W3CTraceContextPropagator
                        // Code based instrumentation - Context Propagation to the Python microservice
                        // Zero code instrumentation
                        // W3CTraceContextPropagator propagator =
                        // W3CTraceContextPropagator.getInstance();
                        // propagator.inject(context, httpPost, HttpPost::setHeader);

                        String responseString = httpClient.execute(httpPost,
                                        response -> EntityUtils.toString(response.getEntity()));
                        JSONObject responseJson = new JSONObject(responseString);
                        return responseJson.get("average_age").toString();
                        // Code based instrumentation - Traces
                } finally {
                        computeSpan.end();
                }
        }
}
