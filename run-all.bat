@echo off
:: Start the backend service in background in the same terminal
pushd f:\WORK\Github_Repository\task-manager\backend
start /b npm run dev
popd

:: Start the frontend service in background in the same terminal
pushd f:\WORK\Github_Repository\task-manager\frontend
start /b npm run dev
popd

:: Open Docker Desktop (runs as a GUI app, opened once)
start /b "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

:: Wait for Docker to be ready
:waitForDocker
docker info >nul 2>&1
if errorlevel 1 (
    timeout /t 5 >nul
    goto waitForDocker
)

:: Start docker-compose in background in the same terminal
pushd f:\WORK\Github_Repository\task-manager
start /b docker-compose up
popd
pause
