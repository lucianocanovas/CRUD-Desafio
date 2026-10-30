@echo off
title Servidor Backend - Concurso ABM
echo ============================================================
echo   INICIANDO BACKEND SPRING BOOT (CONCURSO ABM)
echo ============================================================

set "JAVA_HOME=C:\Users\Juan Cruz\.jdks\openjdk-21.0.2"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Verificando version de Java:
java -version
echo.
echo Ejecutando aplicacion en http://localhost:8080 ...
echo Swagger UI disponible en: http://localhost:8080/swagger-ui.html
echo Consola H2 disponible en: http://localhost:8080/h2-console
echo.

java -jar target/usuario-service-1.0.0-SNAPSHOT.jar

pause
