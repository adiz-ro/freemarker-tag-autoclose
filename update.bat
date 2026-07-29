@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "EXT_ID=adiz.freemarker-tag-autoclose"

echo.
echo === FreeMarker Tag Auto-Close ^& Syntax : actualizare ===
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo EROARE: npm nu a fost gasit in PATH.
  goto :fail
)

where code >nul 2>&1
if errorlevel 1 (
  echo EROARE: comanda "code" nu a fost gasita in PATH.
  goto :fail
)

if not exist node_modules (
  echo [1/5] Lipsesc dependintele, le instalez...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
) else (
  echo [1/5] Dependintele sunt deja instalate.
)

echo.
echo [2/5] Recompilez si rulez testele...
call npm test
if errorlevel 1 goto :fail

echo.
echo [3/5] Reconstruiesc pachetul .vsix...
del /q *.vsix >nul 2>&1
call npx --yes @vscode/vsce package
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
echo [4/5] Scot versiunea veche...
rem Daca extensia nu era instalata, dezinstalarea da eroare - o ignoram intentionat.
call code --uninstall-extension %EXT_ID% >nul 2>&1

echo [5/5] Instalez !VSIX!...
call code --install-extension "!VSIX!" --force
if errorlevel 1 goto :fail

echo.
echo ===============================================================
echo  Actualizat la !VSIX!
echo.
echo  Reload-ul este OBLIGATORIU ca sa se incarce versiunea noua:
echo    Ctrl+Shift+P  -^>  Developer: Reload Window
echo ===============================================================
echo.
pause
exit /b 0

:fail
echo.
echo Actualizarea a esuat. Vezi mesajele de mai sus.
echo.
pause
exit /b 1
