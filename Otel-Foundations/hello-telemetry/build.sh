#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
JAVA_APP_DIR="$SCRIPT_DIR/java-app"
TOMCAT_DIR="$SCRIPT_DIR/tomcat"

echo "Building WAR from $JAVA_APP_DIR..."
mvn -f "$JAVA_APP_DIR/pom.xml" clean package

WAR_FILE="$(find "$JAVA_APP_DIR/target" -maxdepth 1 -type f -name '*.war' -print -quit)"

if [[ -z "$WAR_FILE" ]]; then
  echo "Error: no WAR file was produced in $JAVA_APP_DIR/target" >&2
  exit 1
fi

cp -- "$WAR_FILE" "$TOMCAT_DIR/MyWebApp.war"
echo "Copied $(basename -- "$WAR_FILE") to $TOMCAT_DIR/MyWebApp.war"
