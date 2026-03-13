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
   - For OpenAI: Run command "DIOTEC 360 IA: Configure OpenAI API Key"

## Configuration

Access settings via `Preferences > Settings > DIOTEC 360 IA`:

### Basic Settings
- `diotec360.enabled`: Enable/disable the extension
- `diotec360.provider`: Choose between "ollama" or "openai"
- `diotec360.streaming.enabled`: Enable streaming responses

### Ollama Settings
- `diotec360.ollama.endpoint`: Ollama API endpoint (default: http://localhost:11434)
- `diotec360.ollama.model`: Model name (default: llama3)

### OpenAI Settings
- `diotec360.openai.model`: Model name (default: gpt-4o-mini)

### MoE (Mixture of Experts) Settings
- `diotec360.moe.enabled`: Enable MoE architecture
- `diotec360.moe.writer.provider`: Provider for writer model
- `diotec360.moe.writer.model`: Model override for writer
- `diotec360.moe.critic.provider`: Provider for critic model
- `diotec360.moe.critic.model`: Model for critic (default: gpt-4o-mini)
- `diotec360.moe.critic.enabledForGenerate`: Enable critic for generate command
- `diotec360.moe.critic.enabledForRefactor`: Enable critic for refactor command
- `diotec360.moe.critic.minChars`: Minimum characters to trigger critic review

### Memory Settings
- `diotec360.memory.enabled`: Enable interaction tracking
- `diotec360.memory.storeRawContext`: Store full context in database

### Mathematical Proof Settings
- `diotec360.judge.enabled`: Enable DIOTEC 360 Judge (Z3 theorem prover)
- `diotec360.judge.endpoint`: Judge API endpoint for formal verification

## Commands

- `DIOTEC 360 IA: Generate` - Generate code
- `DIOTEC 360 IA: Explain` - Explain selected code
- `DIOTEC 360 IA: Refactor` - Refactor selected code
- `DIOTEC 360 IA: Chat` - Start interactive chat
- `DIOTEC 360 IA: Chat — Clear History` - Clear chat history for current file
- `DIOTEC 360 IA: Apply Last Suggestion` - Apply the last generated suggestion
- `DIOTEC 360 IA: Configure OpenAI API Key` - Set or update OpenAI API key
- `DIOTEC 360 IA: Configure Anthropic API Key` - Set or update Anthropic API key
- `DIOTEC 360 IA: Open Memory DB` - View interaction history as JSON
- `DIOTEC 360: Buy Credits` - Purchase credits for premium features
- `DIOTEC 360: View Credit Balance` - Check your current credit balance

## Usage

1. Select code in the editor
2. Right-click and choose a DIOTEC 360 IA command, or use Command Palette
3. View results in the preview panel
4. Accept, copy, or edit the suggestions

## MoE Architecture

When enabled, DIOTEC 360 IA uses a two-stage approach:
1. **Writer**: Generates initial code/response
2. **Critic**: Reviews output and provides risk assessment (low/medium/high)

This helps catch potential issues before applying changes.

## Mathematical Proof: Integrated DIOTEC 360 Judge

DIOTEC 360 IA includes an integrated **Z3 Theorem Prover** for financial certainty. When generating code involving financial calculations, payments, or critical business logic, the Judge automatically verifies mathematical correctness using formal methods.

**Key Features:**
- **Automatic Verification**: Financial code is automatically checked for logical consistency
- **Proof Certificates**: Each verification produces a cryptographic proof certificate
- **Zero False Positives**: Mathematical proofs guarantee correctness
- **Distributed Consensus**: Proofs can be verified by any node in the DIOTEC 360 network

This ensures that every line of code suggested by DIOTEC 360 IA for financial operations is mathematically proven to be correct.

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
