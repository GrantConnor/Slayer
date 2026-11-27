@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Play-Slayer.ps1"
if errorlevel 1 (
 echo Slayer Hub could not launch. Review the message above.
 pause
 exit /b 1
)
exit /b 0
