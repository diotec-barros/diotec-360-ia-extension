# Frequently Asked Questions

## General

### What is ANGO IA?

ANGO IA is an AI-powered coding assistant for VS Code that supports multiple LLM providers (Ollama and OpenAI) and features a Mixture of Experts architecture for enhanced code quality.

### Is my code sent to external servers?

- With Ollama: No, everything runs locally
- With OpenAI: Yes, code context is sent to OpenAI's API
- You control what context is included (selection + surrounding lines)

### Where is my data stored?

- API keys: VS Code SecretStorage (encrypted)
- Interaction history: Local SQLite database in VS Code's global storage
- No telemetry or external tracking

## Configuration

### How do I switch between Ollama and OpenAI?

Change the setting:
```json
{
  "angoIA.provider": "ollama" // or "openai"
}
```

### Can I use different models for Writer and Critic?

Yes, with MoE enabled:
```json
{
  "angoIA.moe.enabled": true,
  "angoIA.moe.writer.provider": "ollama",
  "angoIA.moe.writer.model": "llama3",
  "angoIA.moe.critic.provider": "openai",
  "angoIA.moe.critic.model": "gpt-4o-mini"
}
```

### What models are supported?

- Ollama: Any model you have pulled (llama3, codellama, mistral, etc.)
- OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

## Features

### What's the difference between Generate and Refactor?

- Generate: Creates new code based on context and intent
- Refactor: Improves existing code while preserving behavior

### How does the Critic work?

When MoE is enabled:
1. Writer model generates code
2. Critic model reviews it for issues, security, and correctness
3. Provides risk assessment (low/medium/high)
4. You see both output and review before accepting

### Can I edit the generated code before accepting?

Yes! The preview panel has an editable text area. Edit as needed, then click "Accept & Insert".

### What does the Memory system track?

- Provider and model used
- Command type (generate, explain, refactor, chat)
- Context hash (for deduplication)
- Response metrics (chars, timing)
- Your decisions (accepted, rejected, edited, copied)
- MoE review results

### How do I export my interaction history?

Run command: "ANGO IA: Open Memory DB"

This opens a JSON document with all tracked interactions.

## Troubleshooting

### "Ollama error (404)" or connection refused

1. Check Ollama is running: `ollama serve`
2. Verify endpoint: `http://localhost:11434`
3. Ensure model is pulled: `ollama pull llama3`

### "OpenAI API error: Invalid API key"

1. Run "ANGO IA: Configure OpenAI API Key"
2. Paste a valid API key from https://platform.openai.com
3. Verify the key has credits

### Generated code is not relevant

Try:
1. Select more context (include surrounding code)
2. Add comments describing intent
3. Ensure relevant imports are visible
4. Use Chat command to clarify requirements first

### Streaming is slow or choppy

1. Disable streaming: `"angoIA.streaming.enabled": false`
2. For Ollama: Check CPU/GPU usage
3. For OpenAI: Check network connection

### Extension is not activating

1. Check VS Code version (requires 1.90.0+)
2. View Output panel → "ANGO IA" for errors
3. Reload window: Ctrl+Shift+P → "Reload Window"
4. Reinstall extension

### Memory database is too large

Location: `~/.config/Code/User/globalStorage/<publisher>/ango-ia.sqlite`

To reset:
```bash
rm ~/.config/Code/User/globalStorage/*/ango-ia.sqlite
```

Or disable: `"angoIA.memory.enabled": false`

## Performance

### How much context is sent to the LLM?

- Selected text (full)
- 30 lines before cursor
- 30 lines after cursor
- Import statements (up to 2000 chars)
- Open files list (paths only, up to 2000 chars)

### Can I reduce context size?

Currently fixed, but you can:
- Select less code
- Close unrelated files
- Future versions may add configurable context windows

### Does MoE slow down responses?

Yes, slightly:
- Writer generates first (same speed as without MoE)
- Critic reviews after (adds 2-5 seconds typically)
- You can disable for specific commands:
  ```json
  {
    "angoIA.moe.critic.enabledForGenerate": false
  }
  ```

## Privacy & Security

### What data leaves my machine?

With Ollama: Nothing (fully local)

With OpenAI:
- Selected code + context (30 lines before/after)
- Import statements
- Open file paths (not contents)
- Language and workspace name

NOT sent:
- Full file contents (unless selected)
- Other files in workspace
- Git history
- Environment variables

### Can I audit what's sent?

Yes:
1. Enable raw context storage: `"angoIA.memory.storeRawContext": true`
2. Run "ANGO IA: Open Memory DB"
3. Check `raw_context` field in interactions

### Is my API key secure?

Yes:
- Stored in VS Code SecretStorage (encrypted)
- Never logged or exported
- Only used for API requests

## Advanced

### Can I use a custom Ollama endpoint?

Yes:
```json
{
  "angoIA.ollama.endpoint": "http://custom-host:11434"
}
```

### Can I use Azure OpenAI?

Not currently supported. Only OpenAI API is supported.

### Can I add custom prompts?

Not through settings, but you can:
1. Fork the repository
2. Edit `src/prompt/promptBuilder.ts`
3. Build and install locally

### How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md)

### Where can I report bugs?

Open an issue on GitHub with:
- VS Code version
- Extension version
- Provider (Ollama/OpenAI)
- Steps to reproduce
- Error messages from Output panel
