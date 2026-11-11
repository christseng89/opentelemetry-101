# Use the official Tomcat image from the Docker Hub
FROM tomcat:11.0.15

# Install the OpenTelemetry Java agent for automatic servlet/JDBC instrumentation.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /opt/opentelemetry-javaagent.jar

# Copy your web application WAR file to the Tomcat webapps directory
COPY MyWebApp.war /usr/local/tomcat/webapps/

# Export application traces to the OpenTelemetry Collector.
ENV CATALINA_OPTS="-javaagent:/opt/opentelemetry-javaagent.jar -Dotel.service.name=ht-tomcat -Dotel.exporter.otlp.endpoint=http://ht-otel-collector:4317 -Dotel.exporter.otlp.protocol=grpc"

# Start Tomcat
CMD ["catalina.sh", "run"]
