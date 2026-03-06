# Setup Guide

## Prerequisites

- Node.js 20+ and npm
- VS Code 1.90.0 or higher
- Git

## Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/ango-ia/vscode-extension.git
cd vscode-extension
npm install
```

### 2. Configure Providers

#### Option A: Ollama (Local)

1. Install Ollama from https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama3
   ```
3. Verify it's running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

#### Option B: OpenAI

1. Get an API key from https://platform.openai.com
2. In VS Code, run command: "ANGO IA: Configure OpenAI API Key"
3. Paste your API key

### 3. Build and Run

```bash
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

## Configuration

### Basic Settings

Open VS Code Settings (Ctrl+,) and search for "ANGO IA":

```json
{
  "angoIA.enabled": true,
  "angoIA.provider": "ollama",
  "angoIA.streaming.enabled": true,
  "angoIA.ollama.endpoint": "http://localhost:11434",
  "angoIA.ollama.model": "llama3",
  "angoIA.openai.model": "gpt-4o-mini"
}
```

### MoE Configuration

Enable Mixture of Experts for enhanced quality:

```json
{
  "angoIA.moe.enabled": true,
  "angoIA.moe.writer.provider": "ollama",
  "angoIA.moe.writer.model": "llama3",
  "angoIA.moe.critic.provider": "openai",
  "angoIA.moe.critic.model": "gpt-4o-mini",
  "angoIA.moe.critic.enabledForGenerate": true,
  "angoIA.moe.critic.enabledForRefactor": true,
  "angoIA.moe.critic.minChars": 200
}
```

This uses a local Ollama model for generation and OpenAI for review.

### Memory Settings

```json
{
  "angoIA.memory.enabled": true,
  "angoIA.memory.storeRawContext": false
}
```

Set `storeRawContext` to `true` to store full prompts and context (useful for debugging).

## Usage

### Generate Code

1. Select code or place cursor
2. Right-click → "ANGO IA: Generate"
3. View result in preview panel
4. Edit if needed
5. Click "Accept & Insert" to apply

### Explain Code

1. Select code to explain
2. Right-click → "ANGO IA: Explain"
3. Read explanation in preview panel

### Refactor Code

1. Select code to refactor
2. Right-click → "ANGO IA: Refactor"
3. Review suggestions
4. Accept or reject

### Chat

1. Open any file
2. Run "ANGO IA: Chat"
3. Enter your question
4. View response in preview panel
5. Continue conversation (history is maintained per file)

### Clear Chat History

Run "ANGO IA: Chat — Clear History" to reset conversation for current file.

### View Memory

Run "ANGO IA: Open Memory DB" to see all tracked interactions as JSON.

## Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### OpenAI API Errors

- Verify API key is set correctly
- Check API key has credits
- Ensure model name is correct (e.g., "gpt-4o-mini")

### Extension Not Loading

1. Check Output panel → "ANGO IA"
2. Verify TypeScript compilation succeeded
3. Reload window (Ctrl+Shift+P → "Reload Window")

### Memory Database Issues

Database location: `~/.config/Code/User/globalStorage/<publisher>/ango-ia.sqlite`

To reset:
```bash
rm ~/.config/Code/User/globalStorage/*/ango-ia.sqlite
```

## Building for Production

```bash
npm run compile
npm run package
```

This creates a `.vsix` file you can install or publish.

## Next Steps

- Read [ARCHITECTURE.md](../ARCHITECTURE.md) to understand the codebase
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to contribute
- Check [README.md](../README.md) for feature documentation
