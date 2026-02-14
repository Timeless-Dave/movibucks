@echo off
cd /d "%~dp0"

if not exist .git (
    git init
    git branch -M main
)

git remote remove origin 2>nul
git remote add origin https://github.com/Timeless-Dave/movibucks.git

git add -A
git commit -m "Initial commit: Movibucks OOP movie library app"
git push -u origin main

echo.
echo Done! Check https://github.com/Timeless-Dave/movibucks
