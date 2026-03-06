import * as vscode from 'vscode';
import { getApplicableLastSuggestion } from './store';

export class AngoIaSuggestionCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const suggestion = getApplicableLastSuggestion(document.uri, range);
    if (!suggestion) return;

    const action = new vscode.CodeAction('ANGO IA: Apply last suggestion', vscode.CodeActionKind.QuickFix);
    action.command = {
      command: 'angoIA.applyLastSuggestion',
      title: 'Apply last suggestion',
      arguments: [document.uri, suggestion.range]
    };

    return [action];
  }
}
