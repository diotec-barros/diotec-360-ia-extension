# 🏛️ DIOTEC 360 IA - Hardening v3.7 Phase 2 Summary

**Status:** ⏳ IN PROGRESS  
**Objetivo:** Extirpar "ANGO" e estabelecer marca "DIOTEC 360 IA"

## 📊 Escopo Identificado

### Package.json
- **Commands:** 9 comandos `angoIA.*` → `diotec360.*`
- **Titles:** 9 títulos "ANGO IA:" → "DIOTEC 360 IA:"
- **Submenu:** ID e label
- **Config Keys:** 19 keys `angoIA.*` → `diotec360.*`
- **Config Title:** "ANGO IA" → "DIOTEC 360 IA"

### TypeScript Source (15 arquivos)
- **getConfiguration('angoIA')** → **getConfiguration('diotec360')**
- **AngoIaSettings** → **Diotec360Settings**
- **AngoIaSuggestionCodeActionProvider** → **Diotec360SuggestionCodeActionProvider**
- **'ANGO IA'** strings → **'DIOTEC 360 IA'**
- **'angoIA.*'** command strings → **'diotec360.*'**

### Arquivos Afetados
1. `package.json` - 50+ ocorrências
2. `src/extension.ts` - 15 ocorrências
3. `src/config/settings.ts` - 5 ocorrências
4. `src/config/secrets.ts` - 4 ocorrências
5. `src/llm/router.ts` - 3 ocorrências
6. `src/llm/providers/openaiProvider.ts` - 2 ocorrências
7. `src/moe/orchestrator.ts` - 3 ocorrências
8. `src/moe/criticPrompt.ts` - 1 ocorrência
9. `src/suggestions/codeActions.ts` - 4 ocorrências
10. `src/ui/previewPanel.ts` - 2 ocorrências
11. `src/ui/syncStatusBar.ts` - 2 ocorrências
12. `src/lattice/idleDetector.ts` - 1 ocorrência
13. `src/lattice/logicMiner.ts` - 2 ocorrências
14. `src/memory/sync_engine.ts` - 4 ocorrências
15. `src/treasury/creditPurchase.ts` - 4 ocorrências
16. `src/diotec360/kernel_bridge.ts` - 3 ocorrências
17. `src/commands/configureSovereignIdentity.ts` - 2 ocorrências

**Total Estimado:** ~110 ocorrências

## 🎯 Estratégia

Devido à complexidade e volume, vou executar rebranding em 3 ondas:

### Onda 1: Package.json (Crítico)
- Commands, titles, config keys
- Garante que VS Code reconheça novos nomes

### Onda 2: TypeScript Core (Crítico)
- extension.ts, settings.ts, secrets.ts
- Garante que código funcione com novos config keys

### Onda 3: TypeScript Modules (Importante)
- Todos os outros arquivos .ts
- Consistência total da marca

## ⏭️ Próxima Ação

Executar Onda 1 manualmente com precisão cirúrgica.
