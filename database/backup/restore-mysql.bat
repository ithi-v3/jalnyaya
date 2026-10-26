@echo off
REM ============================================================================
REM JalNyaya - MySQL Database Restore Script (Windows Native)
REM Restores backup SQL file using native mysql CLI with environment variables.
REM ============================================================================

setlocal enabledelayedexpansion

REM Usage check: must provide dump file as argument
if "%~1"=="" (
    echo Usage: restore-mysql.bat ^<path_to_backup_file.sql^>
    echo Example: restore-mysql.bat jalnyaya_backup_20261026_213000.sql
    exit /b 1
)

set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo [JalNyaya Restore] Error: Backup file '%BACKUP_FILE%' does not exist!
    exit /b 1
)

REM Set default parameters if not provided in environment
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1
if "%DB_PORT%"=="" set DB_PORT=3307
if "%DB_USER%"=="" set DB_USER=jalnyaya_user
if "%DB_NAME%"=="" set DB_NAME=jalnyaya_db
if "%DB_PASSWORD%"=="" set DB_PASSWORD=jalnyaya123

echo [JalNyaya Restore] Restoring '%BACKUP_FILE%' into database '%DB_NAME%' at %DB_HOST%:%DB_PORT% ...

set MYSQL_PWD=%DB_PASSWORD%

where mysql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% < "%BACKUP_FILE%"
) else (
    echo [JalNyaya Restore] Native mysql not in PATH; restoring via Docker container jalnyaya-mysql...
    docker exec -i jalnyaya-mysql mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%BACKUP_FILE%"
)

if %ERRORLEVEL% EQU 0 (
    echo [JalNyaya Restore] Restoration SUCCESSFUL!
) else (
    echo [JalNyaya Restore] ERROR: Restore failed with exit code %ERRORLEVEL%
)

set MYSQL_PWD=
endlocal
