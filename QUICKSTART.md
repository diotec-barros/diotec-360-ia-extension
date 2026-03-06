# Quick Start Guide

## 5 Minutos para Começar

### 1. Instalar Dependências (1 min)

```bash
npm install
```

### 2. Escolher Provedor (1 min)

#### Opção A: Ollama (Local, Grátis)
```bash
# Instalar Ollama
# Windows: baixar de https://ollama.ai
# Mac: brew install ollama
# Linux: curl https://ollama.ai/install.sh | sh

# Baixar modelo
ollama pull llama3

# Iniciar servidor
ollama serve
```

#### Opção B: OpenAI (Cloud, Pago)
1. Obter API key em https://platform.openai.com
2. Guardar para usar depois

### 3. Compilar e Executar (1 min)

```bash
# Compilar
npm run compile

# Abrir VS Code
code .

# Pressionar F5 para abrir Extension Development Host
```

### 4. Configurar (1 min)

No Extension Development Host:

**Para Ollama:**
- Ctrl+Shift+P → "Preferences: Open Settings (JSON)"
- Adicionar:
```json
{
  "angoIA.provider": "ollama",
  "angoIA.ollama.model": "llama3"
}
```

**Para OpenAI:**
- Ctrl+Shift+P → "ANGO IA: Configure OpenAI API Key"
- Colar sua API key
- Ctrl+Shift+P → "Preferences: Open Settings (JSON)"
- Adicionar:
```json
{
  "angoIA.provider": "openai",
  "angoIA.openai.model": "gpt-4o-mini"
}
```

### 5. Testar (1 min)

1. Criar arquivo `test.js`
2. Escrever: `// create a function to add two numbers`
3. Selecionar o comentário
4. Clicar direito → "ANGO IA: Generate"
5. Ver resultado no painel lateral!

## Comandos Principais

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| Generate | - | Gera código baseado no contexto |
| Explain | - | Explica código selecionado |
| Refactor | - | Refatora código |
| Chat | - | Chat interativo |

## Próximos Passos

### Habilitar MoE (Opcional)

Para ter revisão automática do código gerado:

```json
{
  "angoIA.moe.enabled": true,
  "angoIA.moe.writer.provider": "ollama",
  "angoIA.moe.writer.model": "llama3",
  "angoIA.moe.critic.provider": "openai",
  "angoIA.moe.critic.model": "gpt-4o-mini"
}
```

Isso usa Ollama para gerar e OpenAI para revisar.

### Ver Histórico de Interações

```
Ctrl+Shift+P → "ANGO IA: Open Memory DB"
```

Mostra todas as suas interações em JSON.

### Desabilitar Streaming

Se a resposta estiver lenta ou travando:

```json
{
  "angoIA.streaming.enabled": false
}
```

## Troubleshooting Rápido

### Erro: "Ollama error (404)"
```bash
ollama serve
ollama pull llama3
```

### Erro: "OpenAI API error"
- Verificar API key está correta
- Verificar tem créditos na conta

### Extensão não aparece
- Verificar compilação: `npm run compile`
- Recarregar janela: Ctrl+Shift+P → "Reload Window"

### Resposta não relevante
- Selecionar mais contexto (código ao redor)
- Adicionar comentários explicando o que quer

## Exemplos Rápidos

### Gerar Função
```javascript
// Selecionar esta linha e usar Generate:
// create a function to validate email addresses
```

### Explicar Código
```javascript
// Selecionar este código e usar Explain:
const memoize = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    return cache.has(key) ? cache.get(key) : cache.set(key, fn(...args)).get(key);
  };
};
```

### Refatorar Código
```javascript
// Selecionar este código e usar Refactor:
function processUsers(users) {
  let result = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active == true) {
      result.push(users[i].name);
    }
  }
  return result;
}
```

### Chat
```
Ctrl+Shift+P → "ANGO IA: Chat"
Digite: "How can I optimize this function?"
```

## Recursos

- 📖 [README.md](README.md) - Documentação completa
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura do projeto
- 🔧 [docs/SETUP.md](docs/SETUP.md) - Setup detalhado
- 💡 [docs/EXAMPLES.md](docs/EXAMPLES.md) - Mais exemplos
- ❓ [docs/FAQ.md](docs/FAQ.md) - Perguntas frequentes

## Dica Pro

Ative o MoE com Ollama local para Writer e OpenAI para Critic. Você terá:
- Geração rápida e gratuita (Ollama)
- Revisão de qualidade (OpenAI)
- Custo baixo (só paga pela revisão)

```json
{
  "angoIA.moe.enabled": true,
  "angoIA.moe.writer.provider": "ollama",
  "angoIA.moe.critic.provider": "openai",
  "angoIA.moe.critic.minChars": 200
}
```

Agora você está pronto! 🚀
