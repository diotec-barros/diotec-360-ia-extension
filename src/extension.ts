import * as vscode from 'vscode';
import { generateCommand } from './commands/generate';
import { explainCommand } from './commands/explain';
import { refactorCommand } from './commands/refactor';
import { chatCommand, clearChatHistoryCommand } from './commands/chat';
import { configureApiKeyCommand } from './commands/configureApiKey';
import { configureSovereignIdentityCommand } from './commands/configureSovereignIdentity';
import { openMemoryCommand } from './commands/openMemory';
import { Output } from './utils/logger';
import { AngoIaSuggestionCodeActionProvider } from './suggestions/codeActions';
import { getLastSuggestion } from './suggestions/store';

export function activate(context: vscode.ExtensionContext) {
  const output = new Output('ANGO IA');
  output.info('Extension activated');

  context.subscriptions.push(
    output,
    vscode.commands.registerCommand('angoIA.generate', () => generateCommand(context, output)),
    vscode.commands.registerCommand('angoIA.explain', () => explainCommand(context, output)),
    vscode.commands.registerCommand('angoIA.refactor', () => refactorCommand(context, output)),
    vscode.commands.registerCommand('angoIA.chat', () => chatCommand(context, output)),
    vscode.commands.registerCommand('angoIA.chatClearHistory', () => clearChatHistoryCommand()),
    vscode.commands.registerCommand('angoIA.applyLastSuggestion', async (uri?: vscode.Uri, range?: vscode.Range) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri) return;

      const suggestion = getLastSuggestion(targetUri);
      if (!suggestion) {
        vscode.window.showInformationMessage('ANGO IA: No suggestion available for this file.');
        return;
      }

      const targetRange = range ?? suggestion.range;
      const edit = new vscode.WorkspaceEdit();
      edit.replace(targetUri, targetRange, suggestion.text);
      const ok = await vscode.workspace.applyEdit(edit);
      if (!ok) {
        vscode.window.showErrorMessage('ANGO IA: Failed to apply suggestion.');
      }
    }),
    vscode.commands.registerCommand('angoIA.configureApiKey', () => configureApiKeyCommand(context)),
    vscode.commands.registerCommand('diotec360.configureSovereignIdentity', () => configureSovereignIdentityCommand(context)),
    vscode.commands.registerCommand('angoIA.openMemory', () => openMemoryCommand(context)),
    vscode.languages.registerCodeActionsProvider(
      [{ scheme: 'file' }, { scheme: 'untitled' }],
      new AngoIaSuggestionCodeActionProvider(),
      { providedCodeActionKinds: AngoIaSuggestionCodeActionProvider.providedCodeActionKinds }
    )
  );
}

export function deactivate() {}
