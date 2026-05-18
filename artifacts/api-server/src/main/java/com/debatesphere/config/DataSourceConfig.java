package com.debatesphere.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String rawUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        try {
            String scheme = rawUrl;
            if (scheme.startsWith("postgresql://") || scheme.startsWith("postgres://")) {
                String uriStr = scheme
                        .replace("postgresql://", "pg://")
                        .replace("postgres://", "pg://");
                URI uri = new URI(uriStr);

                String userInfo = uri.getUserInfo();
                String username = null;
                String password = null;
                if (userInfo != null) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    if (parts.length > 1) password = parts[1];
                }

                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String query = uri.getRawQuery();

                String jdbcUrl = "jdbc:postgresql://" + host
                        + (port > 0 ? ":" + port : "")
                        + path
                        + (query != null && !query.isEmpty() ? "?" + query : "");

                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(jdbcUrl);
                if (username != null) config.setUsername(username);
                if (password != null) config.setPassword(password);
                config.setDriverClassName("org.postgresql.Driver");
                config.setMaximumPoolSize(10);
                config.setConnectionTimeout(20000);
                return new HikariDataSource(config);
            }

            // Already a JDBC URL
            String jdbcUrl = rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:postgresql://" + rawUrl;
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(jdbcUrl);
            config.setDriverClassName("org.postgresql.Driver");
            config.setMaximumPoolSize(10);
            config.setConnectionTimeout(20000);
            return new HikariDataSource(config);

        } catch (Exception e) {
            throw new IllegalStateException("Could not configure DataSource from DATABASE_URL: " + e.getMessage(), e);
        }
    }
}
