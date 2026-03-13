import * as vscode from 'vscode';
import { getApplicableLastSuggestion } from './store';

export class Diotec360SuggestionCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const suggestion = getApplicableLastSuggestion(document.uri, range);
    if (!suggestion) return;

    const action = new vscode.CodeAction('DIOTEC 360 IA: Apply last suggestion', vscode.CodeActionKind.QuickFix);
    action.command = {
      command: 'diotec360.applyLastSuggestion',
      title: 'Apply last suggestion',
      arguments: [document.uri, suggestion.range]
    };

    return [action];
  }
}
