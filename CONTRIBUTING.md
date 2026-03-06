# Contributing to ANGO IA

Thank you for your interest in contributing to ANGO IA!

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the project in VS Code
4. Press F5 to launch the Extension Development Host

## Project Structure

```
src/
├── commands/       # Command implementations (generate, explain, refactor, chat)
├── config/         # Settings and secrets management
├── llm/            # LLM provider abstractions
│   └── providers/  # Ollama and OpenAI implementations
├── memory/         # SQLite-based interaction tracking
├── moe/            # Mixture of Experts orchestration
├── prompt/         # Context building and prompt engineering
├── suggestions/    # Code actions for applying suggestions
├── types/          # TypeScript type definitions
├── ui/             # Preview panel and markdown rendering
└── utils/          # Logging and utilities
```

## Building

```bash
npm run compile
```

## Testing

Before submitting a PR:

1. Test all commands (Generate, Explain, Refactor, Chat)
2. Test with both Ollama and OpenAI providers
3. Test MoE functionality if enabled
4. Verify memory tracking works correctly

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with a clear description

## Reporting Issues

When reporting issues, please include:

- VS Code version
- Extension version
- Provider being used (Ollama/OpenAI)
- Steps to reproduce
- Error messages or logs

## Feature Requests

We welcome feature requests! Please open an issue with:

- Clear description of the feature
- Use case and benefits
- Any implementation ideas

## Questions?

Feel free to open an issue for any questions about contributing.
