# 🚀 Teste Rápido - 5 Minutos

## Pré-requisitos

### 1. Ollama Rodando
```bash
ollama serve
ollama pull llama3
```

### 2. OpenAI API Key Configurada
- Ctrl+Shift+P → "ANGO IA: Configure OpenAI API Key"
- Cole sua chave

---

## Teste Rápido (3 minutos)

### 1. Abrir Extension Development Host
- Pressione **F5**
- Aguarde nova janela abrir

### 2. Configurar MOE
- Ctrl+Shift+P → "Preferences: Open Settings (JSON)"
- Cole o conteúdo de `test-files/moe-config.json`
- Salve

### 3. Abrir Arquivo de Teste
- Abra `test-files/basic-test.js`

### 4. Teste Generate Básico
1. Selecione a linha:
   ```javascript
   // create a function to validate email addresses
   ```
2. Clique direito → "ANGO IA: Generate"
3. ✅ Deve gerar código
4. ✅ Preview panel abre à direita

### 5. Teste MOE com Alto Risco
1. Selecione:
   ```javascript
   // create a function to delete user from database using their ID in SQL query
   ```
2. Clique direito → "ANGO IA: Generate"
3. ✅ Código aparece (Writer)
4. ✅ Status muda para "Reviewing..."
5. ✅ Seção "Critic Review" aparece ABAIXO
6. ✅ Badge vermelho "Risk: HIGH" aparece
7. ✅ Review menciona SQL injection

### 6. Teste Accept
1. Clique "Accept & Insert"
2. ✅ Apenas o código é inserido (sem review)
3. ✅ Código aparece no editor

### 7. Verificar Memory
1. Ctrl+Shift+P → "ANGO IA: Open Memory DB"
2. ✅ Veja interações registradas
3. ✅ Veja decisions: `moe_reviewed`, `moe_risk_high`, `accepted`

---

## ✅ Checklist Rápido

- [ ] Generate funciona
- [ ] Preview panel abre
- [ ] MOE review aparece separada
- [ ] Badge de risco aparece com cor
- [ ] Accept insere apenas código
- [ ] Memory registra decisões

---

## 🐛 Se Algo Falhar

### Erro: "Ollama error (404)"
```bash
ollama serve
ollama pull llama3
```

### Erro: "OpenAI API error"
- Verifique API key
- Verifique créditos na conta

### Preview não abre
- View → Output → "ANGO IA"
- Veja logs de erro

### Review não aparece
- Verifique `angoIA.moe.enabled: true`
- Verifique código tem mais de `minChars`
- Veja Output panel para erros

---

## 🎯 Resultado Esperado

Ao final, você deve ver:

```
┌─────────────────────────────────────┐
│ ANGO IA: Generate                   │
├─────────────────────────────────────┤
│ [Accept] [Copy] [Reject] [Cancel]   │
│ ☑ Render Markdown    Status: Done   │
├─────────────────────────────────────┤
│ [Textarea com código gerado]        │
├─────────────────────────────────────┤
│ [Código renderizado com highlight]  │
├─────────────────────────────────────┤
│ ┌─ Critic Review ─────────────────┐ │
│ │ Risk: HIGH 🔴                    │ │
│ │                                  │ │
│ │ ## Issues                        │ │
│ │ - SQL Injection vulnerability    │ │
│ │ - No input validation            │ │
│ │                                  │ │
│ │ ## Recommendations               │ │
│ │ - Use parameterized queries      │ │
│ └──────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📊 Tempo Estimado

- Setup: 2 min
- Testes: 3 min
- **Total: 5 min**

Boa sorte! 🚀
