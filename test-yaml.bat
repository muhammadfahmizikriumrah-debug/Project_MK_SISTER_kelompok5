@echo off
echo Testing docker-compose.yml syntax...
echo.

docker-compose config >nul 2>&1
if errorlevel 1 (
    echo [ERROR] YAML syntax errors found:
    echo.
    docker-compose config
    echo.
    echo Please fix the errors above.
) else (
    echo [SUCCESS] docker-compose.yml syntax is valid!
    echo.
    echo You can now run: run.bat
)

pause
