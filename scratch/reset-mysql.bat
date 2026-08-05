@echo off
echo Stopping MySQL80 service...
net stop MySQL80
echo.
echo Starting MySQL in skip-grant-tables mode...
start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --shared-memory
echo Waiting for MySQL to start...
timeout /t 5 /nobreak >nul
echo.
echo Resetting root password to empty...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY '';"
echo.
echo Stopping skip-grant-tables instance...
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo.
echo Starting MySQL80 service normally...
net start MySQL80
echo.
echo ========================================
echo MySQL root password has been reset!
echo ========================================
pause
