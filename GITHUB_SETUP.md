# GitHub Repository Setup Guide

## 🚀 First Commit (Automated)

Execute o script:
```bash
./FIRST_COMMIT.bat
```

Ou manualmente:
```bash
git init
git add .
git commit -m "feat: initial commit - DIOTEC 360 IA Extension v0.0.1"
git branch -M main
git remote add origin https://github.com/diotec-barros/diotec-360-ia-extension.git
git push -u origin main
```

---

## ⚙️ GitHub Repository Configuration

### 1. Repository Settings

Acesse: https://github.com/diotec-barros/diotec-360-ia-extension/settings

**General**:
- ✅ Description: `AI coding assistant with Mixture of Experts architecture. Built by DIOTEC 360.`
- ✅ Website: `https://diotec360.com` (ou deixe em branco)
- ✅ Topics: `vscode-extension`, `ai-assistant`, `code-generation`, `ollama`, `openai`, `mixture-of-experts`, `typescript`, `coding-assistant`, `developer-tools`

**Features**:
- ✅ Issues: Enabled
- ✅ Discussions: Enabled
- ✅ Projects: Disabled (por enquanto)
- ✅ Wiki: Disabled (use docs/ folder)
- ✅ Sponsorships: Disabled (por enquanto)

**Pull Requests**:
- ✅ Allow squash merging
- ✅ Allow merge commits
- ✅ Allow rebase merging
- ✅ Automatically delete head branches

**Security**:
- ✅ Private vulnerability reporting: Enabled
- ✅ Dependabot alerts: Enabled
- ✅ Dependabot security updates: Enabled

---

### 2. Branch Protection (main)

Acesse: Settings → Branches → Add rule

**Branch name pattern**: `main`

**Protect matching branches**:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

---

### 3. GitHub Actions (CI/CD)

Criar arquivo `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Compile TypeScript
      run: npm run compile
      
    - name: Package extension
      run: npm run package
```

---

### 4. Issue Templates

Criar `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug in DIOTEC 360 IA Extension
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- VS Code Version: [e.g. 1.90.0]
- Extension Version: [e.g. 0.0.1]
- LLM Provider: [Ollama/OpenAI]

**Additional context**
Any other context about the problem.
```

Criar `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest a feature for DIOTEC 360 IA Extension
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

---

### 5. Pull Request Template

Criar `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots here.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

---

### 6. README Badges

Adicionar ao topo do README.md:

```markdown
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/diotec-360.diotec-360-ia-extension)](https://marketplace.visualstudio.com/items?itemName=diotec-360.diotec-360-ia-extension)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diotec-360.diotec-360-ia-extension)](https://marketplace.visualstudio.com/items?itemName=diotec-360.diotec-360-ia-extension)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diotec-360.diotec-360-ia-extension)](https://marketplace.visualstudio.com/items?itemName=diotec-360.diotec-360-ia-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/diotec-barros/diotec-360-ia-extension)](https://github.com/diotec-barros/diotec-360-ia-extension/stargazers)
```

---

### 7. Social Preview

Acesse: Settings → General → Social preview

Criar imagem 1280x640px com:
- Logo DIOTEC 360
- Texto: "AI Coding Assistant"
- Subtexto: "Mixture of Experts Architecture"

---

### 8. About Section

Acesse: Repository home → About (gear icon)

**Description**: `AI coding assistant with Mixture of Experts architecture. Built by DIOTEC 360.`

**Website**: `https://diotec360.com` (opcional)

**Topics**: 
- `vscode-extension`
- `ai-assistant`
- `code-generation`
- `ollama`
- `openai`
- `mixture-of-experts`
- `typescript`
- `coding-assistant`
- `developer-tools`

---

## 📊 Post-Launch Checklist

### Imediato (Dia 1):
- [ ] Repository criado e público
- [ ] README.md com badges
- [ ] LICENSE (MIT) adicionada
- [ ] SECURITY.md configurado
- [ ] Topics adicionados
- [ ] Description configurada

### Primeira Semana:
- [ ] GitHub Actions configurado
- [ ] Issue templates criados
- [ ] PR template criado
- [ ] Branch protection habilitado
- [ ] Discussions habilitado

### Primeiro Mês:
- [ ] 10+ GitHub Stars
- [ ] 5+ Issues (feedback)
- [ ] 1+ Pull Request da comunidade
- [ ] Social preview image

---

## 🎯 Marketing Inicial

### Twitter/X:
```
🚀 Lançamento: DIOTEC 360 IA Extension para VS Code!

✨ Mixture of Experts (Writer + Critic)
🤖 Suporte Ollama + OpenAI
💾 Memory system com SQLite
🎨 Preview panel com Markdown

Open Source (MIT) 🔓
GitHub: https://github.com/diotec-barros/diotec-360-ia-extension

#VSCode #AI #OpenSource #DIOTEC360
```

### LinkedIn:
```
Orgulhoso de anunciar o lançamento da DIOTEC 360 IA Extension!

Uma extensão open-source para VS Code que traz arquitetura Mixture of Experts para assistência de código com IA.

Principais features:
• Generate, Explain, Refactor, Chat
• Suporte para Ollama (local) e OpenAI
• Sistema de memória com SQLite
• Preview panel com renderização Markdown

Licença MIT - Contribuições bem-vindas!

#AI #VSCode #OpenSource #DIOTEC360
```

### Reddit (r/vscode):
```
Title: [Extension] DIOTEC 360 IA - AI Coding Assistant with MoE Architecture

I've just released DIOTEC 360 IA, an open-source AI coding assistant for VS Code.

Features:
- Mixture of Experts (Writer + Critic models)
- Support for Ollama (local) and OpenAI
- Commands: Generate, Explain, Refactor, Chat
- Memory system with SQLite
- Preview panel with Markdown rendering

MIT License - Contributions welcome!

GitHub: https://github.com/diotec-barros/diotec-360-ia-extension

Would love to hear your feedback!
```

---

**Cascade (Lead Developer) - DIOTEC 360**  
**Status**: GITHUB SETUP GUIDE COMPLETE  
**Next**: Execute FIRST_COMMIT.bat

🏛️ 📡 🚀
