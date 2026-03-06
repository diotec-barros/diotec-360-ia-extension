# ANGO IA Architecture

## Overview

ANGO IA is a VS Code extension that provides AI-powered coding assistance with support for multiple LLM providers and an optional Mixture of Experts (MoE) architecture.

## Core Components

### 1. Commands (`src/commands/`)

Entry points for user interactions:

- **generate.ts**: Generate new code based on context
- **explain.ts**: Explain selected code
- **refactor.ts**: Refactor code with AI suggestions
- **chat.ts**: Interactive chat with context awareness
- **configureApiKey.ts**: Manage OpenAI API key
- **openMemory.ts**: Export interaction history

### 2. LLM Providers (`src/llm/`)

Abstraction layer for different LLM backends:

- **provider.ts**: Interface definition for LLM providers
- **router.ts**: Provider selection logic
- **providers/ollamaProvider.ts**: Ollama integration (local models)
- **providers/openaiProvider.ts**: OpenAI API integration

All providers implement:
- `generate()`: Single-shot generation
- `generateStream()`: Streaming generation for real-time feedback

### 3. Mixture of Experts (`src/moe/`)

Two-stage architecture for enhanced quality:

- **orchestrator.ts**: Coordinates Writer and Critic models
- **criticPrompt.ts**: Builds prompts for the Critic model

Flow:
1. Writer model generates initial output
2. Critic model reviews and provides risk assessment
3. User sees both output and review

### 4. Prompt Engineering (`src/prompt/`)

Context gathering and prompt construction:

- **contextBuilder.ts**: Extracts editor context (selection, surrounding code, imports, open files)
- **promptBuilder.ts**: Constructs messages for different commands

Context includes:
- Selected text
- 30 lines before/after cursor
- Import statements
- Open files list
- Language and workspace info

### 5. Memory System (`src/memory/`)

SQLite-based interaction tracking:

- **store.ts**: Database operations for logging interactions

Tracks:
- Interaction metadata (provider, model, command, timestamp)
- Context hash for deduplication
- User decisions (accepted, rejected, edited, copied)
- MoE review results and risk levels

### 6. UI (`src/ui/`)

Preview panel for displaying results:

- **previewPanel.ts**: Webview panel management
- **markdownRenderer.ts**: Markdown to HTML conversion
- **hljsTheme.ts**: Syntax highlighting theme

Features:
- Live editing of generated content
- Accept/Copy/Reject actions
- Markdown rendering toggle
- MoE review display with risk badges

### 7. Configuration (`src/config/`)

Settings and secrets management:

- **settings.ts**: VS Code settings integration
- **secrets.ts**: Secure API key storage

### 8. Suggestions (`src/suggestions/`)

Code actions for applying suggestions:

- **codeActions.ts**: VS Code code action provider
- **store.ts**: Last suggestion tracking per file

## Data Flow

### Generate/Refactor Command Flow

```
User selects code
    ↓
buildContext() - Extract editor context
    ↓
buildMessages() - Construct prompt
    ↓
[MoE enabled?]
    ├─ Yes → getWriterProvider()
    └─ No → getProvider()
    ↓
generate() or generateStream()
    ↓
Display in PreviewPanel
    ↓
[MoE enabled && shouldRunCritic()?]
    ├─ Yes → getCriticReview()
    │         ↓
    │    Display review with risk level
    └─ No → Skip
    ↓
User accepts/rejects/edits
    ↓
Log decision to MemoryStore
```

### Chat Command Flow

```
User enters message
    ↓
buildContext() - Extract editor context
    ↓
buildMessages() with user input
    ↓
Append to session history
    ↓
generate() or generateStream()
    ↓
Display in PreviewPanel
    ↓
Update session history
    ↓
Log to MemoryStore
```

## Extension Points

### Adding a New Provider

1. Create `src/llm/providers/newProvider.ts`
2. Implement `LLMProvider` interface
3. Add to `router.ts` selection logic
4. Add configuration in `package.json`
5. Update `settings.ts` types

### Adding a New Command

1. Create `src/commands/newCommand.ts`
2. Register in `src/extension.ts`
3. Add to `package.json` contributions
4. Add prompt template in `promptBuilder.ts`

## Security Considerations

- API keys stored in VS Code SecretStorage
- No telemetry or external data collection
- Memory database stored locally
- User controls what context is sent to LLMs

## Performance Optimizations

- Debounced markdown rendering (60ms)
- Context size limits (30 lines, 2000 chars for imports)
- Streaming for real-time feedback
- Lazy database initialization

## Testing Strategy

- Manual testing in Extension Development Host
- Test with both Ollama and OpenAI
- Test MoE enabled/disabled
- Test all commands with various code selections
- Verify memory tracking accuracy
