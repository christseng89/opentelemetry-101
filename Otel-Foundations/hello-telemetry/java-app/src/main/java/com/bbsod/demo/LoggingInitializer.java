package com.bbsod.demo;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender;
import org.slf4j.bridge.SLF4JBridgeHandler;

/**
 * Initializes application-wide logging integrations once when the web
 * application starts.
 */
@WebListener
public class LoggingInitializer implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent event) {
        // Logs
        // Install SLF4JBridgeHandler to route JUL logs to SLF4J
        SLF4JBridgeHandler.removeHandlersForRootLogger();
        SLF4JBridgeHandler.install();

        // Install OpenTelemetry in logback appender
        OpenTelemetryAppender.install(GlobalOpenTelemetry.get());
    }
}
