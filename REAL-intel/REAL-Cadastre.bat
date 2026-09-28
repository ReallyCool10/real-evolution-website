@echo off
title REAL intel
cd /d "%~dp0"

echo ========================================================
echo                       REAL intel
echo ========================================================
echo.
echo Starting local services and opening application...
echo Web App: http://localhost:5173
echo Backend: http://localhost:3001
echo.
echo (Keep this window open while using the app. Close it to stop.)
echo ========================================================
echo.

node dev.js
