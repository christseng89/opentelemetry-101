# Use the official Python image from the Docker Hub
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the requirements file into the container
COPY requirements.txt ./

# Install the required packages and the instrumentation libraries discovered
# by the official OpenTelemetry zero-code bootstrap process.
RUN pip install --no-cache-dir -r requirements.txt

# Discover installed Python packages and install their OpenTelemetry
# instrumentation libraries (for example, Flask instrumentation).
# Zero code instrumentation
RUN opentelemetry-bootstrap -a install

# Copy the rest of the application code into the container
COPY . .

# Expose the port that the application will run on
EXPOSE 5000

# Define the command to run the application

# OTEL environment variables
# Zero code instrumentation
ENV OTEL_SERVICE_NAME=ht-python-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://ht-otel-collector:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=otlp
ENV OTEL_LOGS_EXPORTER=otlp
ENV OTEL_PYTHON_LOG_CORRELATION=true

# Run the application with OpenTelemetry zero-code instrumentation
# Zero code instrumentation
CMD [ "opentelemetry-instrument", "python", "compute.py"]
# CMD [ "python", "compute.py"]
