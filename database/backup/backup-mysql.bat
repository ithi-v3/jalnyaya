@echo off
REM ============================================================================
REM JalNyaya - MySQL Database Backup Script (Windows Native)
REM Uses native mysqldump utility with environment variables.
REM ============================================================================

setlocal enabledelayedexpansion

REM Set default parameters if not provided in environment
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1
if "%DB_PORT%"=="" set DB_PORT=3307
if "%DB_USER%"=="" set DB_USER=jalnyaya_user
if "%DB_NAME%"=="" set DB_NAME=jalnyaya_db
if "%DB_PASSWORD%"=="" set DB_PASSWORD=jalnyaya123

REM Formulate backup timestamped filename
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=jalnyaya_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo [JalNyaya Backup] Starting backup for database: %DB_NAME% at %DB_HOST%:%DB_PORT% ...

REM Attempt native mysqldump command
set MYSQL_PWD=%DB_PASSWORD%

REM Check if running via Docker container or local binary
where mysqldump >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --routines --triggers --single-transaction %DB_NAME% > %BACKUP_FILE%
) else (
    REM Fallback to executing via Docker container
    echo [JalNyaya Backup] Native mysqldump not found in PATH; running via Docker container jalnyaya-mysql...
    docker exec jalnyaya-mysql mysqldump -u %DB_USER% -p%DB_PASSWORD% --routines --triggers --single-transaction %DB_NAME% > %BACKUP_FILE%
)

if %ERRORLEVEL% EQU 0 (
    echo [JalNyaya Backup] Backup SUCCESSFUL! Saved to %BACKUP_FILE%
) else (
    echo [JalNyaya Backup] ERROR: Backup failed with exit code %ERRORLEVEL%
)

set MYSQL_PWD=
endlocal
