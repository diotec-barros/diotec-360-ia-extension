# Plano de Testes - ANGO IA

## Status da Build
✅ Compilação bem-sucedida
✅ Sem erros de diagnóstico
✅ MOE UX implementado

---

## 🎯 Testes Prioritários

### 1. Teste Básico - Generate (Sem MOE)

**Objetivo**: Verificar funcionamento básico

**Setup**:
```json
{
  "angoIA.provider": "ollama",
  "angoIA.moe.enabled": false
}
```

**Passos**:
1. Pressione F5 para abrir Extension Development Host
2. Crie arquivo `test.js`
3. Digite:
   ```javascript
   // create a function to validate email
   ```
4. Selecione o comentário
5. Clique direito → "ANGO IA: Generate"

**Resultado Esperado**:
- ✅ Preview panel abre
- ✅ Código é gerado
- ✅ Botões Accept/Copy/Reject aparecem
- ✅ Sem seção "Critic Review"

---

### 2. Teste MOE - Generate com Review

**Objetivo**: Verificar MOE UX com seção dedicada

**Setup**:
```json
{
  "angoIA.provider": "ollama",
  "angoIA.moe.enabled": true,
  "angoIA.moe.writer.provider": "ollama",
  "angoIA.moe.writer.model": "llama3",
  "angoIA.moe.critic.provider": "openai",
  "angoIA.moe.critic.model": "gpt-4o-mini",
  "angoIA.moe.critic.enabledForGenerate": true,
  "angoIA.moe.critic.minChars": 50
}
```

**Passos**:
1. Crie arquivo `security-test.js`
2. Digite:
   ```javascript
   // create a function to delete user from database using SQL
   ```
3. Selecione e execute "ANGO IA: Generate"

**Resultado Esperado**:
- ✅ Preview panel mostra código gerado (Writer)
- ✅ Status muda para "Reviewing..."
- ✅ Seção "Critic Review" aparece SEPARADA
- ✅ Badge de risco aparece (provavelmente HIGH por SQL injection)
- ✅ Badge tem cor apropriada:
  - Verde para LOW
  - Laranja para MEDIUM
  - Vermelho para HIGH
- ✅ Review está em Markdown renderizado
- ✅ Accept insere APENAS o código do Writer (sem review)

---

### 3. Teste MOE - Refactor com Review

**Objetivo**: Verificar MOE no comando Refactor

**Setup**: Mesmo do teste 2

**Passos**:
1. Crie arquivo `refactor-test.js`
2. Digite código problemático:
   ```javascript
   function processData(data) {
     let result = [];
     for (let i = 0; i < data.length; i++) {
       if (data[i].active == true) {
         result.push(data[i]);
       }
     }
     return result;
   }
   ```
3. Selecione todo o código
4. Clique direito → "ANGO IA: Refactor"

**Resultado Esperado**:
- ✅ Código refatorado aparece (Writer)
- ✅ Critic Review aparece separada
- ✅ Badge de risco (provavelmente LOW)
- ✅ Accept aplica apenas código refatorado

---

### 4. Teste MOE - Código Curto (Skip Critic)

**Objetivo**: Verificar que Critic não roda para código pequeno

**Setup**:
```json
{
  "angoIA.moe.enabled": true,
  "angoIA.moe.critic.minChars": 200
}
```

**Passos**:
1. Digite:
   ```javascript
   // add two numbers
   ```
2. Execute "ANGO IA: Generate"

**Resultado Esperado**:
- ✅ Código gerado (curto)
- ✅ SEM seção "Critic Review"
- ✅ Status vai direto para "Done"

---

### 5. Teste Explain (Sem MOE)

**Objetivo**: Verificar que Explain não usa MOE

**Setup**: MOE habilitado

**Passos**:
1. Digite código complexo:
   ```javascript
   const memoize = fn => {
     const cache = new Map();
     return (...args) => {
       const key = JSON.stringify(args);
       return cache.has(key) ? cache.get(key) : cache.set(key, fn(...args)).get(key);
     };
   };
   ```
2. Selecione e execute "ANGO IA: Explain"

**Resultado Esperado**:
- ✅ Explicação aparece
- ✅ SEM seção "Critic Review" (Explain não usa MOE)

---

### 6. Teste Chat (Sem MOE)

**Objetivo**: Verificar que Chat não usa MOE

**Setup**: MOE habilitado

**Passos**:
1. Execute "ANGO IA: Chat"
2. Digite: "How do I optimize this code?"

**Resultado Esperado**:
- ✅ Resposta aparece
- ✅ SEM seção "Critic Review"

---

### 7. Teste Memory Tracking

**Objetivo**: Verificar que decisões MOE são registradas

**Setup**: MOE habilitado + Memory habilitado

**Passos**:
1. Execute Generate com MOE
2. Aguarde review aparecer
3. Clique "Accept"
4. Execute "ANGO IA: Open Memory DB"

**Resultado Esperado**:
```json
{
  "decisions": [
    { "decision": "moe_reviewed" },
    { "decision": "moe_risk_low" }, // ou medium/high
    { "decision": "accepted" }
  ]
}
```

---

### 8. Teste Edição no Preview

**Objetivo**: Verificar que edição funciona com MOE

**Setup**: MOE habilitado

**Passos**:
1. Execute Generate com MOE
2. Aguarde código + review
3. Edite o código no textarea
4. Clique "Accept"

**Resultado Esperado**:
- ✅ Código editado é inserido
- ✅ Decision "edited" é registrada
- ✅ Review não é inserida

---

### 9. Teste Streaming

**Objetivo**: Verificar streaming com MOE

**Setup**:
```json
{
  "angoIA.streaming.enabled": true,
  "angoIA.moe.enabled": true
}
```

**Passos**:
1. Execute Generate
2. Observe o preview

**Resultado Esperado**:
- ✅ Código aparece progressivamente (streaming)
- ✅ Status "Generating..."
- ✅ Depois muda para "Reviewing..."
- ✅ Review aparece após código completo

---

### 10. Teste Cancelamento

**Objetivo**: Verificar cancelamento durante review

**Setup**: MOE habilitado

**Passos**:
1. Execute Generate
2. Aguarde código aparecer
3. Quando status mudar para "Reviewing...", clique "Cancel"

**Resultado Esperado**:
- ✅ Operação cancela
- ✅ Status "Cancelled"
- ✅ Código do Writer permanece visível
- ✅ Review não aparece

---

## 🐛 Checklist de Bugs Comuns

### Visual
- [ ] Badge de risco tem cores corretas
- [ ] Review está separada do código
- [ ] Markdown da review renderiza corretamente
- [ ] Syntax highlighting funciona no código

### Funcional
- [ ] Accept insere apenas Writer output
- [ ] Copy copia apenas Writer output
- [ ] Copy Markdown funciona
- [ ] Reject não insere nada
- [ ] Cancel para operação

### MOE
- [ ] Critic não roda quando desabilitado
- [ ] Critic não roda para código curto
- [ ] Critic não roda em Explain/Chat
- [ ] Risk level é parseado corretamente
- [ ] Decisions são logadas corretamente

### Performance
- [ ] Streaming funciona suavemente
- [ ] Review não trava UI
- [ ] Debouncing de render funciona

---

## 📊 Matriz de Testes

| Comando | MOE Off | MOE On | Streaming | Memory |
|---------|---------|--------|-----------|--------|
| Generate | ✅ | ✅ | ✅ | ✅ |
| Explain | ✅ | N/A | ✅ | ✅ |
| Refactor | ✅ | ✅ | ✅ | ✅ |
| Chat | ✅ | N/A | ✅ | ✅ |

---

## 🚀 Como Executar

1. **Compilar**:
   ```bash
   npm run compile
   ```

2. **Iniciar Debug**:
   - Pressione F5
   - Ou: Run > Start Debugging

3. **Configurar Provider**:
   - Ollama: `ollama serve` + `ollama pull llama3`
   - OpenAI: Configure API key

4. **Executar Testes**:
   - Siga os passos de cada teste acima
   - Marque ✅ ou ❌ conforme resultado

---

## 📝 Relatório de Bugs

Se encontrar problemas, anote:

**Bug #**: ___
**Teste**: ___
**Passos para Reproduzir**:
1. 
2. 
3. 

**Resultado Esperado**: ___
**Resultado Obtido**: ___
**Logs** (Output > ANGO IA): ___

---

## ✅ Aprovação Final

- [ ] Todos os testes prioritários (1-10) passaram
- [ ] Checklist de bugs verificado
- [ ] Performance aceitável
- [ ] UX intuitiva
- [ ] Pronto para uso

**Testado por**: _______________
**Data**: ___/___/___
