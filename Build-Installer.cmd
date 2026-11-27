@echo off
setlocal
pushd "%~dp0" || exit /b 1
call npm install --no-audit --no-fund
if errorlevel 1 goto fail
call npm run dist
if errorlevel 1 goto fail
echo Installer and update metadata are in dist. No files have been published.
pause
popd
exit /b 0
:fail
echo Installer build failed. Check the output above.
pause
popd
exit /b 1
