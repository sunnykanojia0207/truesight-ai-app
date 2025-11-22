@echo off
echo Starting TrueSight AI Frontend...
echo.

cd frontend

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo Frontend will be available at http://localhost:5173
echo.

call npm run dev
