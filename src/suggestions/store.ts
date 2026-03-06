import * as vscode from 'vscode';

type SuggestionSource = 'generate' | 'refactor';

export interface LastSuggestion {
  uri: vscode.Uri;
  range: vscode.Range;
  text: string;
  source: SuggestionSource;
  createdAt: number;
}

const lastSuggestionByUri = new Map<string, LastSuggestion>();

export function setLastSuggestion(s: Omit<LastSuggestion, 'createdAt'>) {
  lastSuggestionByUri.set(s.uri.toString(), { ...s, createdAt: Date.now() });
}

export function getLastSuggestion(uri: vscode.Uri): LastSuggestion | undefined {
  return lastSuggestionByUri.get(uri.toString());
}

export function getApplicableLastSuggestion(uri: vscode.Uri, range: vscode.Range): LastSuggestion | undefined {
  const s = getLastSuggestion(uri);
  if (!s) return undefined;

  if (rangesIntersect(s.range, range)) return s;
  return undefined;
}

function rangesIntersect(a: vscode.Range, b: vscode.Range): boolean {
  return comparePositions(a.end, b.start) >= 0 && comparePositions(b.end, a.start) >= 0;
}

function comparePositions(a: vscode.Position, b: vscode.Position): number {
  if (a.line !== b.line) return a.line - b.line;
  return a.character - b.character;
}
