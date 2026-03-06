# 🚀 COMECE AQUI - ANGO IA

## ✅ Status do Projeto

- ✅ Código compilado sem erros
- ✅ MOE UX implementado
- ✅ Preview Panel com seção dedicada de review
- ✅ Badge de risco visual (Low/Medium/High)
- ✅ Documentação completa
- ✅ Arquivos de teste prontos

---

## 🎯 Próximo Passo: TESTAR

### Opção 1: Teste Rápido (5 minutos) 👈 RECOMENDADO

```bash
# Abrir guia de teste rápido
code test-files/QUICK_TEST.md
```

**O que você vai testar:**
1. Generate básico
2. MOE com review separada
3. Badge de risco
4. Accept (insere apenas código)
5. Memory tracking

### Opção 2: Teste Completo (30 minutos)

```bash
# Abrir plano completo
code TEST_PLAN.md
```

**10 cenários de teste detalhados**

---

## 📋 Checklist Pré-Teste

### 1. Compilar
```bash
npm run compile
```
✅ Feito

### 2. Configurar Provider

**Ollama (Local):**
```bash
ollama serve
ollama pull llama3
```

**OpenAI (Cloud):**
- Ctrl+Shift+P → "ANGO IA: Configure OpenAI API Key"
- Cole sua chave

### 3. Iniciar Debug
- Pressione **F5**
- Aguarde Extension Development Host abrir

### 4. Configurar MOE
- Copie conteúdo de `test-files/moe-config.json`
- Cole em Settings (JSON)

### 5. Abrir Arquivo de Teste
- Abra `test-files/basic-test.js`

---

## 🎨 O Que Você Vai Ver

### Antes (Sem MOE)
```
┌─────────────────────────┐
│ ANGO IA: Generate       │
├─────────────────────────┤
│ [Código gerado aqui]    │
└─────────────────────────┘
```

### Depois (Com MOE) ✨
```
┌─────────────────────────────────┐
│ ANGO IA: Generate               │
├─────────────────────────────────┤
│ [Código gerado - Writer]        │
├─────────────────────────────────┤
│ ┌─ Critic Review ─────────────┐ │
│ │ Risk: HIGH 🔴               │ │
│ │                             │ │
│ │ ## Issues                   │ │
│ │ - SQL Injection risk        │ │
│ │ - No input validation       │ │
│ │                             │ │
│ │ ## Recommendations          │ │
│ │ - Use parameterized queries │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🎯 Teste Mais Importante

**Generate com SQL (Alto Risco)**

1. Selecione:
   ```javascript
   // create a function to delete user from database using their ID in SQL query
   ```

2. Execute "ANGO IA: Generate"

3. Verifique:
   - ✅ Código aparece
   - ✅ Review aparece SEPARADA
   - ✅ Badge vermelho "Risk: HIGH"
   - ✅ Review menciona SQL injection
   - ✅ Accept insere APENAS código

---

## 📊 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `test-files/QUICK_TEST.md` | 🚀 Teste rápido (5 min) |
| `TEST_PLAN.md` | 📋 Plano completo (30 min) |
| `test-files/basic-test.js` | 🧪 Casos de teste |
| `test-files/moe-config.json` | ⚙️ Config MOE |

---

## 🐛 Se Algo Falhar

### Preview não abre
```
View → Output → "ANGO IA"
```
Veja logs de erro

### Ollama não conecta
```bash
ollama serve
ollama pull llama3
curl http://localhost:11434/api/tags
```

### OpenAI erro
- Verifique API key
- Verifique créditos

### Review não aparece
- Verifique `angoIA.moe.enabled: true`
- Verifique código > minChars (50)
- Veja Output panel

---

## 📚 Documentação

- [README.md](README.md) - Visão geral
- [QUICKSTART.md](QUICKSTART.md) - Início rápido
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura
- [docs/SETUP.md](docs/SETUP.md) - Setup detalhado
- [docs/EXAMPLES.md](docs/EXAMPLES.md) - Exemplos
- [docs/FAQ.md](docs/FAQ.md) - FAQ

---

## ✨ Melhorias Implementadas

### MOE UX Aprimorado
- ✅ Review em seção dedicada (não mistura com código)
- ✅ Badge visual de risco com cores
- ✅ Accept/Copy atuam apenas no Writer
- ✅ UI mais limpa e profissional

### Antes vs Depois

**Antes:**
```markdown
[Código gerado]

---

## MOE Review
Risk: high
...
```
❌ Review misturada com código
❌ Accept inseria tudo

**Depois:**
```
[Código gerado]

┌─ Critic Review ─────┐
│ Risk: HIGH 🔴       │
│ [Review aqui]       │
└─────────────────────┘
```
✅ Review separada
✅ Accept insere só código
✅ Badge visual

---

## 🎉 Pronto para Testar!

**Comando para começar:**
```bash
# 1. Pressione F5 (ou Run > Start Debugging)
# 2. Abra test-files/QUICK_TEST.md
# 3. Siga os passos
```

**Tempo estimado:** 5 minutos

**Boa sorte!** 🚀

---

## 📞 Precisa de Ajuda?

1. Consulte [docs/FAQ.md](docs/FAQ.md)
2. Veja logs em Output > "ANGO IA"
3. Revise [TEST_PLAN.md](TEST_PLAN.md)

---

**Última atualização:** Projeto compilado e pronto para teste
**Status:** ✅ PRONTO PARA TESTAR
