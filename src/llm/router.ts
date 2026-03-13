import * as vscode from 'vscode';
import { AngoIaSettings } from '../config/settings';
import { LLMProvider } from './provider';
import { OllamaProvider } from './providers/ollamaProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';
import { getAnthropicApiKey } from '../config/secrets';

export async function getProvider(context: vscode.ExtensionContext, settings: AngoIaSettings): Promise<LLMProvider> {
  if (settings.provider === 'openai') {
    return OpenAIProvider.create(context, settings);
  }

  if (settings.provider === 'anthropic') {
    const apiKey = await getAnthropicApiKey(context);
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please run "DIOTEC 360 IA: Configure Anthropic API Key".');
    }
    return new AnthropicProvider(apiKey, settings.anthropic.model);
  }

  return OllamaProvider.create(settings);
}
