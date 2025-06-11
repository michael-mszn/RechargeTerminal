@echo off
cd /d "C:\Users\Michi\Desktop\Uni\Archiv 12. Semester\Bachelorarbeit\RechargeTerminal"

:: Start PHP server in a new window
start cmd /k "php -S localhost:8000 -t backend & echo PHP Server Started Successfully!"

:: Start npm development server in a new window
start cmd /k "npm run dev & echo NPM Dev Server Started Successfully!"