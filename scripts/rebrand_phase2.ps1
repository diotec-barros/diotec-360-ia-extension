# DIOTEC 360 IA - Hardening v3.7 Phase 2: Total Rebranding
# Extirpa "ANGO" e substitui por "DIOTEC 360 IA"

Write-Host "🔥 PHASE 2: EXORCISMO DE MARCA INICIADO" -ForegroundColor Red
Write-Host "Extirpando 'ANGO' do sistema..." -ForegroundColor Yellow
Write-Host ""

$ErrorActionPreference = "Stop"
$replacements = 0

# Function to replace in file
function Replace-InFile {
    param(
        [string]$FilePath,
        [string]$OldText,
        [string]$NewText
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        if ($content -match [regex]::Escape($OldText)) {
            $newContent = $content -replace [regex]::Escape($OldText), $NewText
            Set-Content $FilePath -Value $newContent -Encoding UTF8 -NoNewline
            $script:replacements++
            Write-Host "  ✓ $FilePath" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

Write-Host "📦 PACKAGE.JSON - Comandos e Config" -ForegroundColor Cyan
Write-Host "Renomeando comandos angoIA.* → diotec360.*" -ForegroundColor Gray

# Package.json: Commands
Replace-InFile "../package.json" '"command": "angoIA.generate"' '"command": "diotec360.generate"'
Replace-InFile "../package.json" '"command": "angoIA.explain"' '"command": "diotec360.explain"'
Replace-InFile "../package.json" '"command": "angoIA.refactor"' '"command": "diotec360.refactor"'
Replace-InFile "../package.json" '"command": "angoIA.chat"' '"command": "diotec360.chat"'
Replace-InFile "../package.json" '"command": "angoIA.chatClearHistory"' '"command": "diotec360.chatClearHistory"'
Replace-InFile "../package.json" '"command": "angoIA.applyLastSuggestion"' '"command": "diotec360.applyLastSuggestion"'
Replace-InFile "../package.json" '"command": "angoIA.configureApiKey"' '"command": "diotec360.configureApiKey"'
Replace-InFile "../package.json" '"command": "angoIA.configureAnthropicApiKey"' '"command": "diotec360.configureAnthropicApiKey"'
Replace-InFile "../package.json" '"command": "angoIA.openMemory"' '"command": "diotec360.openMemory"'

# Package.json: Titles
Replace-InFile "../package.json" '"title": "ANGO IA: Generate"' '"title": "DIOTEC 360 IA: Generate"'
Replace-InFile "../package.json" '"title": "ANGO IA: Explain"' '"title": "DIOTEC 360 IA: Explain"'
Replace-InFile "../package.json" '"title": "ANGO IA: Refactor"' '"title": "DIOTEC 360 IA: Refactor"'
Replace-InFile "../package.json" '"title": "ANGO IA: Chat"' '"title": "DIOTEC 360 IA: Chat"'
Replace-InFile "../package.json" '"title": "ANGO IA: Chat — Clear History"' '"title": "DIOTEC 360 IA: Chat — Clear History"'
Replace-InFile "../package.json" '"title": "ANGO IA: Apply Last Suggestion"' '"title": "DIOTEC 360 IA: Apply Last Suggestion"'
Replace-InFile "../package.json" '"title": "ANGO IA: Configure OpenAI API Key"' '"title": "DIOTEC 360 IA: Configure OpenAI API Key"'
Replace-InFile "../package.json" '"title": "ANGO IA: Configure Anthropic API Key"' '"title": "DIOTEC 360 IA: Configure Anthropic API Key"'
Replace-InFile "../package.json" '"title": "ANGO IA: Open Memory DB"' '"title": "DIOTEC 360 IA: Open Memory DB"'

# Package.json: Submenu
Replace-InFile "../package.json" '"id": "angoIA.submenu"' '"id": "diotec360.submenu"'
Replace-InFile "../package.json" '"label": "ANGO IA"' '"label": "DIOTEC 360 IA"'
Replace-InFile "../package.json" '"angoIA.submenu"' '"diotec360.submenu"'

# Package.json: Configuration title
Replace-InFile "../package.json" '"title": "ANGO IA",' '"title": "DIOTEC 360 IA",'

# Package.json: Config keys
Replace-InFile "../package.json" '"angoIA.enabled"' '"diotec360.enabled"'
Replace-InFile "../package.json" '"angoIA.moe.enabled"' '"diotec360.moe.enabled"'
Replace-InFile "../package.json" '"angoIA.moe.writer.provider"' '"diotec360.moe.writer.provider"'
Replace-InFile "../package.json" '"angoIA.moe.writer.model"' '"diotec360.moe.writer.model"'
Replace-InFile "../package.json" '"angoIA.moe.critic.provider"' '"diotec360.moe.critic.provider"'
Replace-InFile "../package.json" '"angoIA.moe.critic.model"' '"diotec360.moe.critic.model"'
Replace-InFile "../package.json" '"angoIA.moe.critic.enabledForGenerate"' '"diotec360.moe.critic.enabledForGenerate"'
Replace-InFile "../package.json" '"angoIA.moe.critic.enabledForRefactor"' '"diotec360.moe.critic.enabledForRefactor"'
Replace-InFile "../package.json" '"angoIA.moe.critic.minChars"' '"diotec360.moe.critic.minChars"'
Replace-InFile "../package.json" '"angoIA.provider"' '"diotec360.provider"'
Replace-InFile "../package.json" '"angoIA.streaming.enabled"' '"diotec360.streaming.enabled"'
Replace-InFile "../package.json" '"angoIA.ollama.endpoint"' '"diotec360.ollama.endpoint"'
Replace-InFile "../package.json" '"angoIA.ollama.model"' '"diotec360.ollama.model"'
Replace-InFile "../package.json" '"angoIA.openai.model"' '"diotec360.openai.model"'
Replace-InFile "../package.json" '"angoIA.anthropic.model"' '"diotec360.anthropic.model"'
Replace-InFile "../package.json" '"angoIA.memory.enabled"' '"diotec360.memory.enabled"'
Replace-InFile "../package.json" '"angoIA.memory.storeRawContext"' '"diotec360.memory.storeRawContext"'
Replace-InFile "../package.json" '"angoIA.mining.enabled"' '"diotec360.mining.enabled"'
Replace-InFile "../package.json" '"angoIA.mining.idleThresholdSeconds"' '"diotec360.mining.idleThresholdSeconds"'

Write-Host ""
Write-Host "📝 TYPESCRIPT SOURCE FILES" -ForegroundColor Cyan
Write-Host "Atualizando getConfiguration('angoIA') → getConfiguration('diotec360')" -ForegroundColor Gray

# TypeScript files: getConfiguration
$tsFiles = @(
    "../src/config/settings.ts",
    "../src/config/secrets.ts",
    "../src/diotec360/kernel_bridge.ts",
    "../src/commands/configureSovereignIdentity.ts",
    "../src/extension.ts",
    "../src/lattice/logicMiner.ts",
    "../src/memory/sync_engine.ts",
    "../src/treasury/creditPurchase.ts",
    "../src/ui/syncStatusBar.ts"
)

foreach ($file in $tsFiles) {
    Replace-InFile $file "getConfiguration('angoIA')" "getConfiguration('diotec360')"
}

# Extension.ts: Command registrations
Replace-InFile "../src/extension.ts" "'angoIA.generate'" "'diotec360.generate'"
Replace-InFile "../src/extension.ts" "'angoIA.explain'" "'diotec360.explain'"
Replace-InFile "../src/extension.ts" "'angoIA.refactor'" "'diotec360.refactor'"
Replace-InFile "../src/extension.ts" "'angoIA.chat'" "'diotec360.chat'"
Replace-InFile "../src/extension.ts" "'angoIA.chatClearHistory'" "'diotec360.chatClearHistory'"
Replace-InFile "../src/extension.ts" "'angoIA.applyLastSuggestion'" "'diotec360.applyLastSuggestion'"
Replace-InFile "../src/extension.ts" "'angoIA.configureApiKey'" "'diotec360.configureApiKey'"
Replace-InFile "../src/extension.ts" "'angoIA.configureAnthropicApiKey'" "'diotec360.configureAnthropicApiKey'"
Replace-InFile "../src/extension.ts" "'angoIA.openMemory'" "'diotec360.openMemory'"
Replace-InFile "../src/extension.ts" "'_angoIA.internal.recordActivity'" "'_diotec360.internal.recordActivity'"

# Extension.ts: Output channel
Replace-InFile "../src/extension.ts" "new Output('ANGO IA')" "new Output('DIOTEC 360 IA')"

# Extension.ts: Messages
Replace-InFile "../src/extension.ts" "'ANGO IA: No suggestion available for this file.'" "'DIOTEC 360 IA: No suggestion available for this file.'"
Replace-InFile "../src/extension.ts" "'ANGO IA: Failed to apply suggestion.'" "'DIOTEC 360 IA: Failed to apply suggestion.'"

# Code Actions
Replace-InFile "../src/suggestions/codeActions.ts" "AngoIaSuggestionCodeActionProvider" "Diotec360SuggestionCodeActionProvider"
Replace-InFile "../src/suggestions/codeActions.ts" "'ANGO IA: Apply last suggestion'" "'DIOTEC 360 IA: Apply last suggestion'"
Replace-InFile "../src/suggestions/codeActions.ts" "'angoIA.applyLastSuggestion'" "'diotec360.applyLastSuggestion'"

# Settings
Replace-InFile "../src/config/settings.ts" "AngoIaSettings" "Diotec360Settings"
Replace-InFile "../src/config/settings.ts" "getSettings(): AngoIaSettings" "getSettings(): Diotec360Settings"

# Router
Replace-InFile "../src/llm/router.ts" "AngoIaSettings" "Diotec360Settings"
Replace-InFile "../src/llm/router.ts" "settings: AngoIaSettings" "settings: Diotec360Settings"

# OpenAI Provider
Replace-InFile "../src/llm/providers/openaiProvider.ts" "AngoIaSettings" "Diotec360Settings"
Replace-InFile "../src/llm/providers/openaiProvider.ts" "settings: AngoIaSettings" "settings: Diotec360Settings"

# MoE Orchestrator
Replace-InFile "../src/moe/orchestrator.ts" "AngoIaSettings" "Diotec360Settings"
Replace-InFile "../src/moe/orchestrator.ts" "settings: AngoIaSettings" "settings: Diotec360Settings"
Replace-InFile "../src/moe/orchestrator.ts" "cloned: AngoIaSettings" "cloned: Diotec360Settings"

# Critic Prompt
Replace-InFile "../src/moe/criticPrompt.ts" "'You are ANGO IA Critic." "'You are DIOTEC 360 IA Critic."

# Secrets
Replace-InFile "../src/config/secrets.ts" "'angoIA.openai.apiKey'" "'diotec360.openai.apiKey'"
Replace-InFile "../src/config/secrets.ts" "'angoIA.anthropic.apiKey'" "'diotec360.anthropic.apiKey'"
Replace-InFile "../src/config/secrets.ts" "OPENAI_KEY = 'angoIA.openai.apiKey'" "OPENAI_KEY = 'diotec360.openai.apiKey'"
Replace-InFile "../src/config/secrets.ts" "ANTHROPIC_KEY = 'angoIA.anthropic.apiKey'" "ANTHROPIC_KEY = 'diotec360.anthropic.apiKey'"

# Kernel Bridge
Replace-InFile "../src/diotec360/kernel_bridge.ts" "'angoIA.diotec360.privateKeyHex'" "'diotec360.privateKeyHex'"
Replace-InFile "../src/commands/configureSovereignIdentity.ts" "'angoIA.diotec360.privateKeyHex'" "'diotec360.privateKeyHex'"

# Preview Panel
Replace-InFile "../src/ui/previewPanel.ts" "'angoIAPreview'" "'diotec360Preview'"
Replace-InFile "../src/ui/previewPanel.ts" "'ANGO IA'" "'DIOTEC 360 IA'"

# Idle Detector
Replace-InFile "../src/lattice/idleDetector.ts" "'_angoIA.internal.recordActivity'" "'_diotec360.internal.recordActivity'"

# Sync Status Bar
Replace-InFile "../src/ui/syncStatusBar.ts" "'sovereignIdentity.publicKey'" "'diotec360.publicKeyHex'"

# Memory Sync Engine
Replace-InFile "../src/memory/sync_engine.ts" "'sovereignIdentity.publicKey'" "'diotec360.publicKeyHex'"
Replace-InFile "../src/memory/sync_engine.ts" "'sovereignIdentity.privateKey'" "'diotec360.privateKeyHex'"

Write-Host ""
Write-Host "✅ REBRANDING COMPLETO!" -ForegroundColor Green
Write-Host "Total de substituições: $replacements" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔨 Compilando TypeScript..." -ForegroundColor Cyan

# Compile TypeScript
Set-Location ..
npm run compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD VERDE MANTIDO!" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO DE COMPILAÇÃO!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏛️ PHASE 2 COMPLETA - MARCA DIOTEC 360 IA ESTABELECIDA" -ForegroundColor Green
