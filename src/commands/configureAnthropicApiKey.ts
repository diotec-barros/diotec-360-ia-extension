import * as vscode from 'vscode';
import { getAnthropicApiKey, setAnthropicApiKey, deleteAnthropicApiKey } from '../config/secrets';

export async function configureAnthropicApiKeyCommand(context: vscode.ExtensionContext) {
  const existingKey = await getAnthropicApiKey(context);

  const options: vscode.QuickPickItem[] = [
    { label: 'Set API Key', description: 'Configure your Anthropic API key' },
    { label: 'View Current Key', description: 'Show the currently configured API key (masked)' },
    { label: 'Delete API Key', description: 'Remove the stored API key' }
  ];

  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: 'Anthropic API Key Configuration'
  });

  if (!selected) return;

  if (selected.label === 'Set API Key') {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your Anthropic API key',
      password: true,
      placeHolder: 'sk-ant-...',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'API key cannot be empty';
        }
        if (!value.startsWith('sk-ant-')) {
          return 'Anthropic API keys typically start with "sk-ant-"';
        }
        return undefined;
      }
    });

    if (apiKey) {
      await setAnthropicApiKey(context, apiKey.trim());
      vscode.window.showInformationMessage('✅ Anthropic API key configured successfully!');
    }
  } else if (selected.label === 'View Current Key') {
    if (existingKey) {
      const masked = existingKey.slice(0, 10) + '...' + existingKey.slice(-4);
      vscode.window.showInformationMessage(`Current Anthropic API key: ${masked}`);
    } else {
      vscode.window.showWarningMessage('No Anthropic API key configured.');
    }
  } else if (selected.label === 'Delete API Key') {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to delete the Anthropic API key?',
      'Yes',
      'No'
    );

    if (confirm === 'Yes') {
      await deleteAnthropicApiKey(context);
      vscode.window.showInformationMessage('✅ Anthropic API key deleted.');
    }
  }
}
