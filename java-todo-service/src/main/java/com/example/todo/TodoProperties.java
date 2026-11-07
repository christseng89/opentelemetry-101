package com.example.todo;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "todo")
public record TodoProperties(String dataJson, int maxItems) {
}
