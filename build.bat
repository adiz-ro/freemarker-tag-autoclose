@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "EXT_ID=adiz.freemarker-tag-autoclose"

rem ==================================================================
rem  Utilizare:
rem    build.bat                          patch + mesaj implicit
rem    build.bat patch "mesajul meu"      0.3.0 -^> 0.3.1
rem    build.bat minor "mesajul meu"      0.3.0 -^> 0.4.0
rem    build.bat major "mesajul meu"      0.3.0 -^> 1.0.0
rem    build.bat "mesajul meu"            patch, cu mesajul dat
rem ==================================================================

set "BUMP=%~1"
set "MSG=%~2"

rem Normalizam si la litere mici: npm version nu accepta "MAJOR".
if /i "%BUMP%"=="patch" (
  set "BUMP=patch"
  goto :args_ok
)
if /i "%BUMP%"=="minor" (
  set "BUMP=minor"
  goto :args_ok
)
if /i "%BUMP%"=="major" (
  set "BUMP=major"
  goto :args_ok
)
if "%BUMP%"=="" (
  set "BUMP=patch"
  goto :args_ok
)
rem Primul argument nu este un tip de versiune, deci este mesajul de commit.
set "MSG=%BUMP%"
set "BUMP=patch"

:args_ok

echo.
echo === Build + publicare : incrementare %BUMP% ===
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
  echo [1/6] Lipsesc dependintele, le instalez...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
) else (
  echo [1/6] Dependintele sunt deja instalate.
)

echo.
echo [2/6] Recompilez si rulez testele...
call npm test
if errorlevel 1 (
  echo.
  echo Testele au picat. Nu incrementez versiunea si nu public nimic.
  goto :fail
)

echo.
echo [3/6] Incrementez versiunea ^(%BUMP%^)...
call npm version %BUMP% --no-git-tag-version
if errorlevel 1 goto :fail

set "VERSION="
for /f "delims=" %%v in ('node -p "require('./package.json').version" 2^>nul') do set "VERSION=%%v"
if not defined VERSION (
  echo EROARE: nu am putut citi versiunea din package.json.
  goto :fail
)
echo      Versiunea noua: !VERSION!

if "%MSG%"=="" set "MSG=Release v!VERSION!"

echo.
echo [4/6] Construiesc pachetul .vsix...
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
echo [5/6] Instalez !VSIX! in VS Code...
call code --uninstall-extension %EXT_ID% >nul 2>&1
call code --install-extension "!VSIX!" --force
if errorlevel 1 goto :fail

echo.
echo [6/6] Public pe GitHub...
rem Transmise prin mediu ca sa nu se incurce ghilimelele din mesaj.
set "SKIP_TESTS=1"
set "COMMIT_MSG=!MSG!"
set "TAG_NAME=v!VERSION!"
call "%~dp0git_publish.bat"
if errorlevel 1 (
  echo.
  echo Versiunea !VERSION! a fost construita si instalata local,
  echo dar publicarea pe GitHub a esuat. Vezi mesajele de mai sus.
  echo Poti relua doar publicarea ruland git_publish.bat.
  exit /b 1
)

echo.
echo ===============================================================
echo  Gata. Versiunea !VERSION! este construita, instalata si publicata.
echo.
echo  Nu uita, in VS Code:
echo    Ctrl+Shift+P  -^>  Developer: Reload Window
echo ===============================================================
echo.
exit /b 0

:fail
echo.
echo Build-ul a esuat. Vezi mesajele de mai sus.
echo.
pause
exit /b 1
