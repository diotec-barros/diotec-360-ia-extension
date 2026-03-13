# DIOTEC 360 IA Extension

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.7.0-green.svg)](https://github.com/diotec-barros/diotec-360-ia-extension)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)](https://github.com/diotec-barros/diotec-360-ia-extension)
[![Build](https://img.shields.io/badge/build-passing-success.svg)](https://github.com/diotec-barros/diotec-360-ia-extension)

AI coding assistant for VS Code with advanced features including Mixture of Experts (MoE) architecture and interaction memory.

**Built by [DIOTEC 360](https://github.com/diotec-barros)** - The TCP/IP of Money

## Features

- **Generate**: Generate code based on context and selection
- **Explain**: Get detailed explanations of selected code
- **Refactor**: Intelligent code refactoring suggestions
- **Chat**: Interactive chat with context awareness
- **MoE Architecture**: Writer + Critic model for enhanced code quality
- **Memory System**: Track and analyze all interactions with SQLite storage

## Supported Providers

- **Ollama**: Local LLM inference (default)
- **OpenAI**: GPT-4 and other OpenAI models

## Installation

1. Install the extension from VS Code Marketplace
2. Configure your preferred provider:
   - For Ollama: Ensure Ollama is running locally
   - For OpenAI: Run command "ANGO IA: Configure OpenAI API Key"

## Configuration

Access settings via `Preferences > Settings > ANGO IA`:

### Basic Settings
- `angoIA.enabled`: Enable/disable the extension
- `angoIA.provider`: Choose between "ollama" or "openai"
- `angoIA.streaming.enabled`: Enable streaming responses

### Ollama Settings
- `angoIA.ollama.endpoint`: Ollama API endpoint (default: http://localhost:11434)
- `angoIA.ollama.model`: Model name (default: llama3)

### OpenAI Settings
- `angoIA.openai.model`: Model name (default: gpt-4o-mini)

### MoE (Mixture of Experts) Settings
- `angoIA.moe.enabled`: Enable MoE architecture
- `angoIA.moe.writer.provider`: Provider for writer model
- `angoIA.moe.writer.model`: Model override for writer
- `angoIA.moe.critic.provider`: Provider for critic model
- `angoIA.moe.critic.model`: Model for critic (default: gpt-4o-mini)
- `angoIA.moe.critic.enabledForGenerate`: Enable critic for generate command
- `angoIA.moe.critic.enabledForRefactor`: Enable critic for refactor command
- `angoIA.moe.critic.minChars`: Minimum characters to trigger critic review

### Memory Settings
- `angoIA.memory.enabled`: Enable interaction tracking
- `angoIA.memory.storeRawContext`: Store full context in database

## Commands

- `ANGO IA: Generate` - Generate code
- `ANGO IA: Explain` - Explain selected code
- `ANGO IA: Refactor` - Refactor selected code
- `ANGO IA: Chat` - Start interactive chat
- `ANGO IA: Chat — Clear History` - Clear chat history for current file
- `ANGO IA: Apply Last Suggestion` - Apply the last generated suggestion
- `ANGO IA: Configure OpenAI API Key` - Set or update OpenAI API key
- `ANGO IA: Open Memory DB` - View interaction history as JSON

## Usage

1. Select code in the editor
2. Right-click and choose an ANGO IA command, or use Command Palette
3. View results in the preview panel
4. Accept, copy, or edit the suggestions

## MoE Architecture

When enabled, ANGO IA uses a two-stage approach:
1. **Writer**: Generates initial code/response
2. **Critic**: Reviews output and provides risk assessment (low/medium/high)

This helps catch potential issues before applying changes.

## Memory System

All interactions are stored in a SQLite database including:
- Provider and model used
- Command type and context
- Response metrics
- User decisions (accepted, rejected, edited, etc.)
- MoE review results

Use "Open Memory DB" command to export and analyze your interaction history.

## Requirements

- VS Code 1.90.0 or higher
- For Ollama: Ollama installed and running locally
- For OpenAI: Valid API key

## License

MIT
