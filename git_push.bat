@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo === Git Push ===
echo.

set "BR="
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BR=%%b"
if not defined BR (
    echo EROARE: acest folder nu e un repo git, sau nu are niciun commit inca.
    goto :end
)
echo Branch: !BR!
echo.

set /p msg="Mesaj commit (Enter pentru 'Update'): "
if "%msg%"=="" set msg=Update

git add -A
git commit -m "%msg%"
git push origin !BR!

:end
echo.
echo === Gata ===
pause
endlocal
