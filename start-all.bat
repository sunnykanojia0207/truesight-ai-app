@echo off
echo Starting TrueSight AI - All Services
echo.
echo This will start:
echo - Frontend (http://localhost:5173)
echo - Backend (http://localhost:3000)
echo - AI Engine (http://localhost:8000)
echo - MongoDB (localhost:27017)
echo - Redis (localhost:6379)
echo.
echo Press Ctrl+C to stop all services
echo.

docker-compose up
