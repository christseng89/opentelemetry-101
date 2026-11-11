# Use the official Python image from the Docker Hub
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the requirements file into the container
COPY requirements.txt ./

# Install the required packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port that the application will run on
EXPOSE 5000

# Define the command to run the application

# OTEL environment variables
ENV OTEL_SERVICE_NAME=ht-python-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://ht-otel-collector:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc
ENV OTEL_TRACES_EXPORTER=otlp

# Run the application with OpenTelemetry instrumentation
CMD [ "opentelemetry-instrument", "python", "compute.py"]
