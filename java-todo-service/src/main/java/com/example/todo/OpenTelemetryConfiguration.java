package com.example.todo;

import com.example.todo.telemetry.CsTelemetry;
import com.example.todo.telemetry.opentelemetry.OpenTelemetryTelemetry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenTelemetryConfiguration {
    @Bean
    CsTelemetry telemetry() {
        return new OpenTelemetryTelemetry("java-todo-service");
    }
}
