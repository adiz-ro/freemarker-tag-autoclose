@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo === FreeMarker Tag Auto-Close ^& Syntax : instalare ===
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo EROARE: npm nu a fost gasit in PATH.
  echo Instaleaza Node.js de la https://nodejs.org si incearca din nou.
  goto :fail
)

where code >nul 2>&1
if errorlevel 1 (
  echo EROARE: comanda "code" nu a fost gasita in PATH.
  echo In VS Code apasa Ctrl+Shift+P si ruleaza:
  echo   Shell Command: Install 'code' command in PATH
  goto :fail
)

echo [1/4] Instalez dependintele...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo [2/4] Rulez testele...
call npm test
if errorlevel 1 goto :fail

echo.
echo [3/4] Construiesc pachetul .vsix...
del /q *.vsix >nul 2>&1
call npx --yes @vscode/vsce package --allow-missing-repository --skip-license
if errorlevel 1 goto :fail

set "VSIX="
for /f "delims=" %%f in ('dir /b /o-d *.vsix 2^>nul') do (
  if not defined VSIX set "VSIX=%%f"
)
if not defined VSIX (
  echo EROARE: nu am gasit niciun fisier .vsix dupa impachetare.
  goto :fail
)

echo.
echo [4/4] Instalez !VSIX! in VS Code...
call code --install-extension "!VSIX!" --force
if errorlevel 1 goto :fail

echo.
echo ===============================================================
echo  Gata. !VSIX! este instalat.
echo.
echo  Ultimul pas, in VS Code:
echo    Ctrl+Shift+P  -^>  Developer: Reload Window
echo ===============================================================
echo.
pause
exit /b 0

:fail
echo.
echo Instalarea a esuat. Vezi mesajele de mai sus.
echo.
pause
exit /b 1
