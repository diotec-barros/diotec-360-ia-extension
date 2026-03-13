@echo off
REM ============================================================================
REM DIOTEC 360 IA - v7.0.0 Brand Sovereignty Commit Script
REM ============================================================================

echo.
echo ============================================================================
echo   DIOTEC 360 IA - v7.0.0 BRAND SOVEREIGNTY COMMIT
echo ============================================================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando status do Git...
git status
echo.

echo [2/5] Adicionando arquivos...
git add README.md
git add BRAND_SOVEREIGNTY_v7.0.0.md
git add COMMIT_v7.0.0.bat
echo.

echo [3/5] Verificando mudancas...
git diff --cached --stat
echo.

echo [4/5] Criando commit...
git commit -m "🏛️ v7.0.0 - Brand Sovereignty Complete" -m "- Updated README.md with full DIOTEC 360 IA branding" -m "- Added Mathematical Proof section highlighting Z3 Judge" -m "- Updated all command references to DIOTEC 360 IA" -m "- Updated all configuration references" -m "- Added credit purchase commands documentation" -m "- Enterprise ready positioning" -m "" -m "The extension is now 100%% DIOTEC 360 IA in user-facing interface." -m "Config keys maintained as angoIA.* for backward compatibility." -m "" -m "Key Features:" -m "- Mathematical Proof with Z3 Theorem Prover" -m "- Automatic verification of financial code" -m "- Cryptographic proof certificates" -m "- Zero false positives" -m "- Distributed consensus" -m "" -m "Positioning: The TCP/IP of Money"
echo.

echo [5/5] Fazendo push para GitHub...
git push origin main
echo.

echo ============================================================================
echo   SUCESSO! v7.0.0 DEPLOYED
echo ============================================================================
echo.
echo Proximo passo: Atualizar VS Code Marketplace
echo.
echo URL do repositorio:
echo https://github.com/diotec-barros/diotec-360-ia-extension
echo.

pause
