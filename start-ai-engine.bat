@echo off
cd ai-engine
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Upgrading pip...
python -m pip install --upgrade pip --quiet
echo Installing dependencies (this may take a few minutes)...
pip install --upgrade -r requirements.txt --quiet
echo.
echo Starting AI Engine on http://localhost:8000
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
