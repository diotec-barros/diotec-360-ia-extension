import * as vscode from 'vscode';
import { AngoIaSettings } from '../config/settings';
import { LLMProvider } from './provider';
import { OllamaProvider } from './providers/ollamaProvider';
import { OpenAIProvider } from './providers/openaiProvider';

export async function getProvider(context: vscode.ExtensionContext, settings: AngoIaSettings): Promise<LLMProvider> {
  if (settings.provider === 'openai') {
    return OpenAIProvider.create(context, settings);
  }

  return OllamaProvider.create(settings);
}
