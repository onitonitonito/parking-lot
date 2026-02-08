@echo off
echo Starting AI Drone Vision Client (PWA Mode)
echo Target Resolution: 2062x991
echo Ensure python app.py is running...

rem Chrome 시도
start chrome --app=http://localhost:5000 --window-size=2062,1025
if %errorlevel% equ 0 goto end

rem Edge 시도 (Chrome 실패 시)
start msedge --app=http://localhost:5000 --window-size=2062,1025

:end
exit
