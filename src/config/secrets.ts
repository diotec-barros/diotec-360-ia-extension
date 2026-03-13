import * as vscode from 'vscode';

const OPENAI_KEY = 'angoIA.openai.apiKey';
const ANTHROPIC_KEY = 'angoIA.anthropic.apiKey';

export async function getOpenAIApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  return context.secrets.get(OPENAI_KEY);
}

export async function setOpenAIApiKey(context: vscode.ExtensionContext, apiKey: string): Promise<void> {
  await context.secrets.store(OPENAI_KEY, apiKey);
}

export async function deleteOpenAIApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(OPENAI_KEY);
}

export async function getAnthropicApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  return context.secrets.get(ANTHROPIC_KEY);
}

export async function setAnthropicApiKey(context: vscode.ExtensionContext, apiKey: string): Promise<void> {
  await context.secrets.store(ANTHROPIC_KEY, apiKey);
}

export async function deleteAnthropicApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(ANTHROPIC_KEY);
}
