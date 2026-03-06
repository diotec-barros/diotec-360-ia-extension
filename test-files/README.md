# 📁 Arquivos de Teste

Esta pasta contém tudo que você precisa para testar a extensão ANGO IA.

## 📄 Arquivos

### 🚀 QUICK_TEST.md
**Teste rápido de 5 minutos**
- Setup básico
- Testes essenciais
- Checklist de verificação

👉 **COMECE POR AQUI!**

### 📋 TEST_PLAN.md (na raiz)
**Plano completo de testes**
- 10 cenários de teste detalhados
- Matriz de cobertura
- Checklist de bugs
- Relatório de bugs

### 🧪 basic-test.js
**Arquivo com casos de teste prontos**
- Generate básico
- Generate com alto risco (SQL injection)
- Explain
- Refactor
- Código curto (skip critic)

### ⚙️ moe-config.json
**Configuração MOE pronta para usar**
- Writer: Ollama (llama3)
- Critic: OpenAI (gpt-4o-mini)
- Todas as opções configuradas

## 🎯 Como Usar

### Opção 1: Teste Rápido (Recomendado)
```bash
# 1. Abrir guia rápido
code test-files/QUICK_TEST.md

# 2. Seguir os passos (5 minutos)
```

### Opção 2: Teste Completo
```bash
# 1. Abrir plano completo
code TEST_PLAN.md

# 2. Executar todos os 10 testes
```

## 📊 O Que Testar

### ✅ Funcionalidades Básicas
- [x] Generate
- [x] Explain
- [x] Refactor
- [x] Chat

### ✅ MOE (Mixture of Experts)
- [x] Review aparece separada
- [x] Badge de risco (Low/Medium/High)
- [x] Cores corretas
- [x] Accept insere apenas código

### ✅ UI/UX
- [x] Preview panel
- [x] Markdown rendering
- [x] Syntax highlighting
- [x] Botões funcionam

### ✅ Integração
- [x] Ollama
- [x] OpenAI
- [x] Streaming
- [x] Memory tracking

## 🐛 Reportar Bugs

Se encontrar problemas:

1. Anote os detalhes no TEST_PLAN.md
2. Verifique logs: View → Output → "ANGO IA"
3. Tire screenshot se possível

## 💡 Dicas

### Para Testar MOE
- Use código que gere SQL queries (alto risco)
- Use código simples (baixo risco)
- Teste com código < minChars (skip critic)

### Para Testar Streaming
- Use prompts que gerem muito código
- Observe o texto aparecer progressivamente

### Para Testar Memory
- Execute vários comandos
- Abra Memory DB ao final
- Verifique todas as decisões registradas

## 📈 Progresso

Marque conforme testa:

- [ ] Teste Rápido (5 min)
- [ ] Teste Generate com MOE
- [ ] Teste Refactor com MOE
- [ ] Teste Explain
- [ ] Teste Chat
- [ ] Teste Memory
- [ ] Teste Streaming
- [ ] Teste Cancelamento
- [ ] Teste Edição
- [ ] Teste Completo (10 cenários)

## 🎉 Sucesso!

Quando todos os testes passarem:
- ✅ Extensão está funcional
- ✅ MOE UX está correto
- ✅ Pronto para uso real

---

**Boa sorte com os testes!** 🚀

Se precisar de ajuda, consulte:
- [README.md](../README.md) - Documentação geral
- [docs/FAQ.md](../docs/FAQ.md) - Perguntas frequentes
- [docs/SETUP.md](../docs/SETUP.md) - Setup detalhado
