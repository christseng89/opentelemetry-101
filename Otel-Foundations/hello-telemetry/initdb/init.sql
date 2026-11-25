CREATE TABLE mytable (
    ID INT PRIMARY KEY,
    Name VARCHAR(255),
    Age INT
);

INSERT INTO mytable (ID, Name, Age) VALUES
(1, 'Alice', 25),
(2, 'Bob', 30),
(3, 'Charlie', 36);

-- Grants required by the OpenTelemetry Collector MySQL receiver.
-- The MYSQL_USER account is created by the MySQL image before this script runs.
GRANT SELECT ON performance_schema.* TO 'myuser'@'%';
GRANT REPLICATION CLIENT ON *.* TO 'myuser'@'%';
