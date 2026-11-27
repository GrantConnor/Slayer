@echo off
rem Git checkouts use the authenticated source updater.
if exist "%~dp0.git" if exist "%~dp0Play-Slayer.cmd" (
 call "%~dp0Play-Slayer.cmd"
 exit /b
)
setlocal EnableExtensions DisableDelayedExpansion
set "STEP=Opening game folder"
pushd "%~dp0" || goto nofolder
set "LOG=%CD%\Build.log"
> "%LOG%" echo Slayer Hub build diagnostics
if errorlevel 1 goto nolog
>> "%LOG%" echo Working directory: "%CD%"
echo Game folder: "%CD%"
rem Warn about ZIP extraction temp directories, but allow complete builds there.
if defined TEMP (
 findstr /I /L /C:"%TEMP%" "%LOG%" >nul
 if not errorlevel 1 echo WARNING: Running in a temporary folder. Extract the entire ZIP to a permanent folder if any files are missing.
)
set "STEP=Checking required game files"
for %%F in (Build-and-Play.cmd Loading.gif main.js updater.js package.json preload.js README.txt Slayer.html Splash.html) do (
 if not exist "%%F" (
  echo Missing required file: %%F
  >> "%LOG%" echo Missing required file: %%F
  goto failed
 )
)
if not exist "assets\interface\gold.png" (
 echo Missing assets folder. Extract the entire ZIP.
 goto failed
)
set "STEP=Checking Node.js and npm"
where node >> "%LOG%" 2>&1 || goto dependencies
where npm >> "%LOG%" 2>&1 || goto dependencies
node --version >> "%LOG%" 2>&1 || goto dependencies
call npm --version >> "%LOG%" 2>&1 || goto dependencies
set "STEP=Installing Electron"
if not exist "node_modules\electron\dist\electron.exe" (
 echo Installing Electron. See Build.log for details.
 call npm install --no-audit --no-fund >> "%LOG%" 2>&1
 if errorlevel 1 goto failed
)
set "STEP=Verifying Electron installation"
if not exist "node_modules\electron\dist\electron.exe" goto failed
if not exist "node_modules\electron\dist\resources\default_app.asar" goto failed
set "STEP=Copying Electron runtime"
if not exist "Portable\Slayer Hub.exe" (
 if not exist "Portable\" mkdir "Portable" >> "%LOG%" 2>&1
 if not exist "Portable\" goto failed
 xcopy /E /I /Y "node_modules\electron\dist" "Portable" >> "%LOG%" 2>&1
 if errorlevel 1 goto failed
 ren "Portable\electron.exe" "Slayer Hub.exe" >> "%LOG%" 2>&1
 if errorlevel 1 goto failed
)
set "STEP=Creating application folder"
if not exist "Portable\resources\app\" mkdir "Portable\resources\app" >> "%LOG%" 2>&1
if not exist "Portable\resources\app\" goto failed
set "STEP=Copying game files"
for %%F in (main.js preload.js updater.js package.json Slayer.html Loading.gif Splash.html) do (
 copy /Y "%%F" "Portable\resources\app\%%F" >> "%LOG%" 2>&1
 if errorlevel 1 goto failed
 if not exist "Portable\resources\app\%%F" goto failed
)
set "STEP=Copying game assets"
robocopy "assets" "Portable\resources\app\assets" /E /R:2 /W:1 >> "%LOG%" 2>&1
if errorlevel 8 goto failed
if not exist "Portable\resources\app\assets\interface\gold.png" goto failed
set "STEP=Verifying and launching portable game"
if not exist "Portable\Slayer Hub.exe" goto failed
if not exist "Portable\resources\default_app.asar" goto failed
if not exist "Portable\icudtl.dat" goto failed
start "" "%CD%\Portable\Slayer Hub.exe"
if errorlevel 1 goto failed
>> "%LOG%" echo Launch requested successfully.
popd
exit /b 0
:dependencies
echo Install Node.js LTS from https://nodejs.org/ and reopen this window.
goto failed
:failed
echo.
echo Build failed: %STEP%
>> "%LOG%" echo Build failed: %STEP%
echo Ensure the entire ZIP is extracted to a writable local folder, such as C:\Games\SlayerHub.
echo Close any running Slayer Hub game before rebuilding.
echo An internet connection is needed for the initial Electron installation.
echo Send this log for troubleshooting: "%LOG%"
pause
popd
exit /b 1
:nolog
echo Cannot write Build.log. Extract to a writable folder and retry.
pause
popd
exit /b 1
:nofolder
echo Cannot open the script folder. Extract the full ZIP to a local folder and retry.
pause
exit /b 1
