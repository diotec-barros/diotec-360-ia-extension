@echo off
echo ========================================
echo DIOTEC 360 IA Extension - First Commit
echo ========================================
echo.

echo [1/6] Initializing Git repository...
git init

echo.
echo [2/6] Adding all files...
git add .

echo.
echo [3/6] Creating first commit...
git commit -m "feat: initial commit - DIOTEC 360 IA Extension v0.0.1

- AI coding assistant with MoE architecture
- Commands: Generate, Explain, Refactor, Chat
- Support for Ollama and OpenAI
- Memory system with SQLite
- Preview panel with Markdown rendering
- MIT License
- Built by DIOTEC 360"

echo.
echo [4/6] Setting main branch...
git branch -M main

echo.
echo [5/6] Adding remote origin...
git remote add origin https://github.com/diotec-barros/diotec-360-ia-extension.git

echo.
echo [6/6] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo SUCCESS! Repository published to GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Visit: https://github.com/diotec-barros/diotec-360-ia-extension
echo 2. Add topics: vscode-extension, ai-assistant, ollama, openai
echo 3. Add description and website
echo 4. Enable Issues and Discussions
echo.
pause
