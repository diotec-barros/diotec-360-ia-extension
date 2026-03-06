# ANGO IA - Estratégia de Repositório Público

## 🏛️ DECISÃO ESTRATÉGICA: PÚBLICO

**Data**: 6 de Março de 2026  
**Decisão**: Repositório PÚBLICO no GitHub  
**Razão**: Adoção massiva através de transparência  
**Modelo**: Open Core (Frontend público, Backend soberano)

---

## 🎯 POR QUE PÚBLICO?

### 1. Confiança do Desenvolvedor
- Programadores não instalam extensões de IA sem auditar o código
- Transparência = Prova de que respeitamos privacidade
- Código aberto = Sem backdoors, sem telemetria maliciosa

### 2. VS Code Marketplace
- Extensões públicas recebem selo de confiança
- Ranking superior em buscas
- Maior visibilidade orgânica

### 3. Colaboração Global
- Desenvolvedores encontram bugs gratuitamente
- Sugestões de features da comunidade
- Pull requests melhoram a qualidade

### 4. Marketing Gratuito
- GitHub Stars = Prova social
- Forks = Evangelistas do produto
- Issues = Engajamento da comunidade

---

## 🛡️ O QUE MANTER PRIVADO?

### ✅ PÚBLICO (ANGO IA Extension)
```
✓ Código TypeScript da extensão
✓ Interface do VS Code (commands, UI)
✓ Preview Panel e Markdown rendering
✓ LLM Router (Ollama/OpenAI)
✓ Memory Store (SQLite local)
✓ MoE Orchestrator (Writer + Critic)
✓ Documentação e exemplos
```

### 🔒 PRIVADO (DIOTEC 360 Core)
```
✗ Aethel Judge (Z3 theorem prover backend)
✗ Aethel Vault (cryptographic storage)
✗ Sentinel (autonomous threat detection)
✗ Synchrony Protocol (parallel execution)
✗ Trading Strategies (Takashi, Simons, Dalio)
✗ Enterprise Audit Backend
✗ API Keys e Tokens
```

---

## 🏗️ ARQUITETURA OPEN CORE

```
┌─────────────────────────────────────────────────────────────┐
│                    PÚBLICO (GitHub)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ANGO IA Extension (MIT License)                      │  │
│  │  - VS Code Commands                                   │  │
│  │  - LLM Integration (Ollama/OpenAI)                   │  │
│  │  - Preview Panel UI                                   │  │
│  │  - Memory Store (local SQLite)                       │  │
│  │  - MoE Orchestrator                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ API                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  PRIVADO (Backend SaaS)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DIOTEC 360 Core (Apache 2.0 - Self-hosted)         │  │
│  │  - Aethel Judge (Z3 formal verification)            │  │
│  │  - Aethel Vault (cryptographic storage)             │  │
│  │  - Sentinel (threat detection)                       │  │
│  │  - Synchrony (parallel execution)                    │  │
│  │  - Trading Strategies (Enterprise)                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 ESTRUTURA DO REPOSITÓRIO PÚBLICO

```
ango-ia/                          (GitHub: diotec-360/ango-ia)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # CI/CD automático
│   │   └── publish.yml          # Publish to VS Code Marketplace
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── src/                          # Código TypeScript (PÚBLICO)
├── docs/                         # Documentação completa
├── test-files/                   # Exemplos de uso
├── .gitignore                    # Ignora secrets e .env
├── .vscodeignore                 # Ignora arquivos no package
├── LICENSE                       # MIT License
├── README.md                     # Marketing + Setup
├── ARCHITECTURE.md               # Arquitetura técnica
├── CONTRIBUTING.md               # Guia de contribuição
├── CHANGELOG.md                  # Histórico de versões
├── SECURITY.md                   # Política de segurança
└── package.json                  # Metadata da extensão
```

---

## 🔐 CHECKLIST DE SEGURANÇA PRÉ-PUBLICAÇÃO

### ✅ Antes de tornar público:

- [ ] **Remover todas as API Keys**
  - Verificar `.env` não está commitado
  - Verificar `secrets.ts` usa VS Code SecretStorage
  - Verificar nenhum token hardcoded no código

- [ ] **Limpar histórico do Git**
  - Verificar commits antigos não contêm secrets
  - Usar `git filter-branch` se necessário
  - Considerar criar repo novo se histórico comprometido

- [ ] **Atualizar .gitignore**
  ```gitignore
  # Secrets
  .env
  .env.*
  *.key
  *.pem
  secrets/
  
  # VS Code
  .vscode/settings.json
  
  # Build
  dist/
  out/
  node_modules/
  
  # OS
  .DS_Store
  Thumbs.db
  ```

- [ ] **Adicionar LICENSE**
  - MIT License (recomendado para extensões)
  - Copyright: Dionísio Sebastião Barros / DIOTEC 360

- [ ] **README.md de Elite**
  - Badge do VS Code Marketplace
  - GIF demonstrando uso
  - Instruções de instalação
  - Link para DIOTEC 360 Core (se público)

- [ ] **SECURITY.md**
  - Como reportar vulnerabilidades
  - Email: security@diotec360.com
  - Política de divulgação responsável

---

## 📝 LICENÇA RECOMENDADA

### MIT License (Para ANGO IA Extension)

```
MIT License

Copyright (c) 2024-2026 Dionísio Sebastião Barros / DIOTEC 360

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Por que MIT?**
- Mais permissiva (empresas podem usar sem medo)
- Compatível com VS Code Marketplace
- Incentiva forks e contribuições
- Padrão da indústria para extensões

---

## 🚀 PLANO DE LANÇAMENTO

### Fase 1: Preparação (1-2 dias)
1. ✅ Limpar secrets do código
2. ✅ Adicionar LICENSE (MIT)
3. ✅ Atualizar README.md com badges
4. ✅ Criar SECURITY.md
5. ✅ Configurar .gitignore

### Fase 2: Publicação (1 dia)
1. Criar repositório `diotec-360/ango-ia` no GitHub
2. Push inicial com tag `v0.0.1`
3. Configurar GitHub Actions (CI/CD)
4. Adicionar descrição e topics no GitHub

### Fase 3: Marketplace (1-2 dias)
1. Publicar no VS Code Marketplace
2. Adicionar screenshots e GIF
3. Configurar auto-update via GitHub Actions

### Fase 4: Marketing (contínuo)
1. Post no Twitter/LinkedIn
2. Post no Reddit (r/vscode, r/programming)
3. Post no Dev.to
4. Email para lista de early adopters

---

## 📊 MÉTRICAS DE SUCESSO

### Primeiros 30 dias:
- 🎯 100+ GitHub Stars
- 🎯 1,000+ instalações no VS Code Marketplace
- 🎯 10+ Pull Requests da comunidade
- 🎯 50+ Issues (feedback)

### Primeiros 90 dias:
- 🎯 500+ GitHub Stars
- 🎯 10,000+ instalações
- 🎯 Rating 4.5+ no Marketplace
- 🎯 5+ contribuidores ativos

---

## 🌐 BRANDING

### Nome do Repositório
- **GitHub**: `diotec-360/ango-ia`
- **VS Code Marketplace**: `DIOTEC 360 IA` ou `Aethel IA`
- **Display Name**: `ANGO IA - AI Coding Assistant`

### Descrição Curta
```
AI coding assistant with Mixture of Experts architecture. 
Generate, explain, refactor code with Ollama/OpenAI. 
Built by DIOTEC 360.
```

### Topics (GitHub)
```
vscode-extension
ai-assistant
code-generation
ollama
openai
mixture-of-experts
typescript
coding-assistant
developer-tools
```

---

## 🤝 CONTRIBUIÇÃO DA COMUNIDADE

### Como aceitar contribuições:

1. **CONTRIBUTING.md**
   - Guia de setup local
   - Padrões de código (ESLint, Prettier)
   - Como submeter PR
   - Code of Conduct

2. **Issue Templates**
   - Bug Report
   - Feature Request
   - Question

3. **PR Template**
   - Descrição da mudança
   - Testes adicionados
   - Screenshots (se UI)

4. **Code Review**
   - Revisar PRs em 48h
   - Feedback construtivo
   - Merge rápido se aprovado

---

## 💰 MONETIZAÇÃO (Mantendo Público)

### Modelo Freemium:

**Grátis (ANGO IA Extension)**:
- Generate, Explain, Refactor, Chat
- Ollama local (ilimitado)
- OpenAI (user's own API key)
- Memory tracking local

**Pago (DIOTEC 360 Backend)**:
- Aethel Judge (formal verification)
- Aethel Vault (cryptographic storage)
- Sentinel (threat detection)
- Trading Strategies
- Enterprise Audit
- Priority support

### Preços Sugeridos:
- **Free**: $0/mês (extensão básica)
- **Pro**: $9/mês (backend verification)
- **Enterprise**: $99/mês (audit + strategies)

---

## 🏁 VEREDITO FINAL

**Dionísio, o repositório ANGO IA deve ser PÚBLICO.**

### Razões:
1. ✅ Confiança = Adoção massiva
2. ✅ VS Code Marketplace favorece públicos
3. ✅ Colaboração global gratuita
4. ✅ Marketing orgânico via GitHub
5. ✅ Backend privado mantém vantagem competitiva

### Próximos Passos:
1. Limpar secrets do código
2. Adicionar LICENSE (MIT)
3. Criar repo `diotec-360/ango-ia`
4. Push inicial com v0.0.1
5. Publicar no VS Code Marketplace

---

**Cascade (Lead Developer) - DIOTEC 360**  
**Status**: REPOSITORY STRATEGY DEFINED  
**Objective**: MASS ADOPTION THROUGH TRANSPARENCY  
**Verdict**: PUBLIC FRONTEND, SOVEREIGN BACKEND

🏛️ 📡 🛡️ 🚀
