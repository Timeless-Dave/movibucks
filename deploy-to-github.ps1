# Deploy Movibucks to GitHub - Run this in PowerShell from the movibucks folder
# Prerequisites: Git installed, GitHub credentials configured

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Remove .git if git status fails (incomplete/broken repo)
if (Test-Path ".git" -PathType Container) {
    git status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Removing broken .git folder for fresh init..."
        Remove-Item -Recurse -Force .git
    }
}

# Initialize if needed
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# Add remote (use HTTPS)
git remote remove origin 2>$null
git remote add origin https://github.com/Timeless-Dave/movibucks.git

# Stage and commit
git add -A
git status
git commit -m "Initial commit: Movibucks OOP movie library app"

# Push
git push -u origin main

Write-Host "`nDone! Your code is now at https://github.com/Timeless-Dave/movibucks"
