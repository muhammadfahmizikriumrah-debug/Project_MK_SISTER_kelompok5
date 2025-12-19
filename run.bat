@echo off
REM filepath: run.bat
title taskThink - Starting...

echo.
echo ======================================
echo taskThink - Start Script
echo ======================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [INFO] Docker is running...
echo.

REM Validate docker-compose.yml syntax
echo [INFO] Validating docker-compose.yml syntax...
docker-compose config >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose.yml has YAML syntax errors!
    echo.
    echo Running validation to show errors:
    docker-compose config
    echo.
    echo Please fix the YAML syntax errors above and try again.
    pause
    exit /b 1
)
echo [INFO] docker-compose.yml syntax is valid...
echo.

REM Stop old containers
echo [INFO] Stopping old containers...
docker-compose down >nul 2>&1

REM Build and start services
echo [INFO] Building and starting services (this may take a few minutes)...
docker-compose up -d --build
if errorlevel 1 (
    echo [ERROR] Build/Start failed!
    echo.
    echo Showing recent logs:
    docker-compose logs --tail 20
    echo [ERROR] Failed to start services!
    pause
    exit /b 1
)

REM Wait for services to be ready (increased to 90 seconds for all services to stabilize)
echo [INFO] Waiting for services to start (90 seconds)...
timeout /t 90 /nobreak

REM Check if services are running
echo.
echo [INFO] Checking services status...
docker-compose ps
echo.

REM Check frontend logs for errors
echo [INFO] Checking frontend logs...
docker-compose logs frontend --tail 15
echo.

REM Open browser
echo [SUCCESS] Services started successfully!
echo.
echo Opening http://localhost:3000 in browser...
timeout /t 5
start http://localhost:3000

echo.
echo ======================================
echo Services running at:
echo - Frontend:       http://localhost:3000
echo - API Gateway:    http://localhost:8080
echo - MinIO:          http://localhost:9001
echo - RabbitMQ:       http://localhost:15672
echo - PostgreSQL:     localhost:5432
echo ======================================
echo.
echo To view logs: docker-compose logs -f
echo To view frontend logs: docker-compose logs frontend -f
echo To stop:      docker-compose down
echo.
pause