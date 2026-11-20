from flask import Flask, request, jsonify
from opentelemetry import metrics, trace

# Zero-code instrumentation
# OpenTelemetry SDK
# from opentelemetry.sdk.metrics import MeterProvider  # Meter
# from opentelemetry.sdk.resources import Resource
# from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
# from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
# from opentelemetry.semconv.resource import ResourceAttributes

# Code based instrumentation - Traces
# from opentelemetry.sdk.trace import TracerProvider
# from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
# from opentelemetry.sdk.trace.export import BatchSpanProcessor
# from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

# Logs
import logging
import atexit
from opentelemetry._logs import get_logger_provider

# Zero-code instrumentation
# from opentelemetry._logs import set_logger_provider
# from opentelemetry.exporter.otlp.proto.grpc._log_exporter import (
#     OTLPLogExporter,
# )

from opentelemetry.sdk._logs import LoggingHandler

# Zero-code instrumentation
# from opentelemetry.sdk._logs import LoggerProvider
# from opentelemetry.sdk._logs.export import BatchLogRecordProcessor

# Zero-code instrumentation
# Code based instrumentation - Metrics
# resource = Resource.create({ResourceAttributes.SERVICE_NAME: "ht-python-service"})
# exporter = OTLPMetricExporter(endpoint="http://ht-otel-collector:4317", insecure=True)
# reader = PeriodicExportingMetricReader(exporter, export_interval_millis=10000)
# meterProvider = MeterProvider(resource=resource, metric_readers=[reader])
# metrics.set_meter_provider(meterProvider)
meter = metrics.get_meter(__name__)

# Code based instrumentation - Metrics Counter
compute_request_count = meter.create_counter(
    name="app_compute_request_count",
    description="Counts the requests to compute-service",
    unit="1",
)

# Zero-code instrumentation
# Code based instrumentation - Traces
# span_exporter = OTLPSpanExporter(
#     endpoint="http://ht-otel-collector:4317", insecure=True
# )
# span_processor = BatchSpanProcessor(span_exporter)
# tracer_provider = TracerProvider(resource=resource)
# tracer_provider.add_span_processor(span_processor)
# trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)

# OpenTelemetry SDK
# Zero-code instrumentation
# Logs
# log_exporter = OTLPLogExporter(endpoint="http://ht-otel-collector:4317", insecure=True)
# log_processor = BatchLogRecordProcessor(log_exporter)
# logger_provider = LoggerProvider(resource=resource)
# logger_provider.add_log_record_processor(log_processor)
# set_logger_provider(logger_provider)

logger_provider = get_logger_provider()
handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)

# Configure logging
logging.basicConfig(level=logging.NOTSET, handlers=[handler])

# Create namespaced logger
logger = logging.getLogger()
# Zero-code instrumentation
logger.setLevel(logging.INFO)

app = Flask(__name__)


@app.route("/compute_average_age", methods=["POST"])
def compute_average_age():

    # Code based instrumentation - Metrics
    compute_request_count.add(1)

    # Code based instrumentation - Context propagation
    # context = TraceContextTextMapPropagator().extract(request.headers)

    # Code based instrumentation - Traces + Context propagation
    # Zero-code instrumentation
    # with tracer.start_as_current_span("ComputeSpan", context=context):
    with tracer.start_as_current_span("ComputeSpan"):
        # Logging
        logger.info("Received request to compute average age")
        # Process the request data
        data = request.json["data"]
        if not data:
            # Logging
            logger.error("No data provided")
            return jsonify({"error": "No data provided"}), 400

        # Extract ages from the data
        ages = [item["age"] for item in data if "age" in item]
        if not ages:
            # Logging
            logger.error("No age data available")
            return jsonify({"error": "No age data available"}), 400

        # Compute the average age
        average_age = round(sum(ages) / len(ages), 1)

        logger.info(f"Computed average age: {average_age}")
        return jsonify({"average_age": average_age})


# Logs => Add a shutdown hook to shut down the logger provider
# Zero-code instrumentation
# atexit.register(logger_provider.shutdown)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
