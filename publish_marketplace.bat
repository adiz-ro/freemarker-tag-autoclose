@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem ==================================================================
rem  Publica extensia pe VS Code Marketplace.
rem
rem  Publica versiunea curenta din package.json, asa cum este. Daca vrei
rem  o versiune noua, ruleaza mai intai:  build.bat patch "mesaj"
rem
rem  Autentificare, aleg una:
rem    npx @vscode/vsce login adiz     - o singura data, tine minte tokenul
rem    set VSCE_PAT=<tokenul tau>      - doar pentru sesiunea curenta
rem ==================================================================

set "PUBLISHER=adiz"

echo.
echo === Publicare pe VS Code Marketplace ===
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo EROARE: npm nu a fost gasit in PATH.
  goto :fail
)

set "VERSION="
for /f "delims=" %%v in ('node -p "require('./package.json').version" 2^>nul') do set "VERSION=%%v"
if not defined VERSION (
  echo EROARE: nu am putut citi versiunea din package.json.
  goto :fail
)

set "NAME="
for /f "delims=" %%n in ('node -p "require('./package.json').name" 2^>nul') do set "NAME=%%n"

echo Se publica: %PUBLISHER%.!NAME! versiunea !VERSION!
echo.
echo ATENTIE: publicarea este definitiva. Poti retrage extensia, dar
echo identificatorul %PUBLISHER%.!NAME! ramane rezervat permanent.
echo.
set "CONFIRM="
set /p "CONFIRM=Scrie DA ca sa continui: "
if /i not "!CONFIRM!"=="DA" (
  echo Anulat.
  exit /b 0
)

echo.
echo [1/2] Rulez testele...
call npm test
if errorlevel 1 (
  echo.
  echo Testele au picat. Nu public cod stricat.
  goto :fail
)

echo.
echo [2/2] Trimit pe Marketplace...
call npx --yes @vscode/vsce publish --no-git-tag-version --no-update-package-json
if errorlevel 1 (
  echo.
  echo Publicarea a esuat. Cauzele obisnuite:
  echo.
  echo  1. Nu esti autentificat. Ruleaza:
  echo        npx @vscode/vsce login %PUBLISHER%
  echo     sau seteaza VSCE_PAT cu tokenul tau.
  echo.
  echo  2. Tokenul nu are drepturile corecte. In Azure DevOps, tokenul
  echo     trebuie creat cu Organization = "All accessible organizations"
  echo     si scope-ul Marketplace -^> Manage.
  echo.
  echo  3. Publisher-ul "%PUBLISHER%" nu exista sau nu iti apartine.
  echo     Creeaza-l pe https://marketplace.visualstudio.com/manage
  echo     si asigura-te ca este identic cu campul "publisher" din package.json.
  echo.
  echo  4. Versiunea !VERSION! este deja publicata. Ruleaza intai:
  echo        build.bat patch "mesaj"
  goto :fail
)

echo.
echo ===============================================================
echo  Publicat: %PUBLISHER%.!NAME! v!VERSION!
echo.
echo  Apare la cautare in VS Code in cateva minute:
echo    https://marketplace.visualstudio.com/items?itemName=%PUBLISHER%.!NAME!
echo.
echo  Instalare pentru oricine:
echo    code --install-extension %PUBLISHER%.!NAME!
echo ===============================================================
echo.
pause
exit /b 0

:fail
echo.
echo Publicarea a esuat. Vezi mesajele de mai sus.
echo.
pause
exit /b 1
