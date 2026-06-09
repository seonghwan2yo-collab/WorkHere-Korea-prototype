@echo off
cd /d "D:\시큐웨어_프로젝트\+NEW_PROJECT+\workhere korea"

git init
git config user.email "newoldsong@secuware.co.kr"
git config user.name "seonghwan2yo-collab"
git branch -M main
git add .
git commit -m "initial commit"
git remote add origin https://github.com/seonghwan2yo-collab/workhere-korea.git
git push -u origin main

pause
