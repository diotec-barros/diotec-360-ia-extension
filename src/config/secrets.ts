import * as vscode from 'vscode';

const OPENAI_KEY = 'angoIA.openai.apiKey';

export async function getOpenAIApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  return context.secrets.get(OPENAI_KEY);
}

export async function setOpenAIApiKey(context: vscode.ExtensionContext, apiKey: string): Promise<void> {
  await context.secrets.store(OPENAI_KEY, apiKey);
}

export async function deleteOpenAIApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(OPENAI_KEY);
}
