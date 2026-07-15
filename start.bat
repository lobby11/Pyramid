@echo off
echo Starting Pyramid AI...

start "Pyramid Backend" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && python -m uvicorn app.main:app --reload"

timeout /t 3 /nobreak >nul

start "Pyramid Frontend" cmd /k "cd /d %~dp0\pyramid-next && npm run dev"

echo Both servers are starting in separate windows.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
