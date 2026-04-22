@echo off
set PATH=C:\Users\KARMA\AppData\Local\Programs\Git\cmd;%PATH%
cd /d c:\Users\KARMA\Desktop\pharmAI\pharmAI-v2
git config user.email "karmanaik@users.noreply.github.com"
git config user.name "karmanaik-glitch"
git add -A
git commit -m "PharmAI v2 - React Supabase Cloud Sync"
git branch -M main
git push -u origin main
