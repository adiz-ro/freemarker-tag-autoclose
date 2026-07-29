@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem ==================================================================
rem  Configurare - modifica aici daca vrei alt nume sau alta vizibilitate.
rem ==================================================================
set "GH_USER=adiz-ro"
set "REPO_NAME=freemarker-tag-autoclose"

rem Conteaza doar daca repo-ul este creat automat cu utilitarul 'gh'.
rem Pune "public" daca vrei sa fie vizibil pentru oricine.
set "VISIBILITY=private"
rem ==================================================================

set "REPO_URL=https://github.com/%GH_USER%/%REPO_NAME%.git"

set "MSG=%*"
if "%MSG%"=="" set "MSG=Update FreeMarker Tag Auto-Close and Syntax"

echo.
echo === Publicare pe GitHub: %GH_USER%/%REPO_NAME% ===
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo EROARE: git nu a fost gasit in PATH.
  echo Instaleaza-l de la https://git-scm.com/download/win
  goto :fail
)

set "GIT_EMAIL="
for /f "delims=" %%i in ('git config user.email 2^>nul') do set "GIT_EMAIL=%%i"
if not defined GIT_EMAIL (
  echo EROARE: git nu stie cine esti. Ruleaza o singura data:
  echo    git config --global user.name  "Numele Tau"
  echo    git config --global user.email "tu@exemplu.ro"
  goto :fail
)

echo [1/5] Rulez testele inainte de publicare...
call npm test
if errorlevel 1 (
  echo.
  echo Testele au picat. Nu public cod stricat.
  goto :fail
)

echo.
echo [2/5] Pregatesc repo-ul local...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  git init -b main
  if errorlevel 1 goto :fail
  echo      Repo git initializat.
) else (
  echo      Repo git deja existent.
)

echo.
echo [3/5] Adaug si comit modificarile...
git add -A
if errorlevel 1 goto :fail

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%"
  if errorlevel 1 goto :fail
) else (
  echo      Nu sunt modificari noi de comis.
)

set "BRANCH="
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"
if not defined BRANCH set "BRANCH=main"

echo.
echo [4/5] Configurez remote-ul...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  where gh >nul 2>&1
  if errorlevel 1 (
    git remote add origin "%REPO_URL%"
    echo      origin -^> %REPO_URL%
  ) else (
    echo      Creez repo-ul pe GitHub cu 'gh' ^(%VISIBILITY%^)...
    gh repo create %GH_USER%/%REPO_NAME% --%VISIBILITY% --source=. --remote=origin
    if errorlevel 1 (
      git remote add origin "%REPO_URL%"
    )
  )
) else (
  echo      origin este deja configurat.
)

echo.
echo [5/5] Trimit pe GitHub, branch-ul !BRANCH!...
git push -u origin !BRANCH!
if errorlevel 1 (
  echo.
  echo Push-ul a esuat. Cauzele obisnuite:
  echo.
  echo  1. Repo-ul nu exista inca pe GitHub. Creeaza-l GOL, fara README,
  echo     fara .gitignore si fara licenta:
  echo        https://github.com/new
  echo     Nume: %REPO_NAME%   Proprietar: %GH_USER%
  echo     Apoi ruleaza din nou acest script.
  echo.
  echo  2. Autentificarea a fost refuzata. La prima folosire, Git Credential
  echo     Manager deschide o fereastra de login GitHub - accepta-o.
  echo.
  echo  3. Repo-ul de pe GitHub are deja commit-uri diferite. Atunci ruleaza:
  echo        git pull --rebase origin !BRANCH!
  echo     si dupa aceea din nou acest script.
  goto :fail
)

echo.
echo ===============================================================
echo  Publicat: https://github.com/%GH_USER%/%REPO_NAME%
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
