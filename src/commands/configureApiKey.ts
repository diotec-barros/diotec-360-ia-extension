import * as vscode from 'vscode';
import { setOpenAIApiKey, deleteOpenAIApiKey } from '../config/secrets';

export async function configureApiKeyCommand(context: vscode.ExtensionContext) {
  const value = await vscode.window.showInputBox({
    title: 'Configure OpenAI API Key',
    prompt: 'Paste your OpenAI API key (leave empty to remove).',
    password: true,
    ignoreFocusOut: true
  });

  if (value === undefined) return;

  if (value.trim().length === 0) {
    await deleteOpenAIApiKey(context);
    vscode.window.showInformationMessage('ANGO IA: OpenAI API key removed.');
    return;
  }

  await setOpenAIApiKey(context, value.trim());
  vscode.window.showInformationMessage('ANGO IA: OpenAI API key saved.');
}
