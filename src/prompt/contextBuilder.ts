import * as vscode from 'vscode';
import { createHash } from 'crypto';

export interface EditorContext {
  languageId: string;
  fileName: string;
  workspaceName: string;
  relativePath: string;
  openFiles: string;
  importLines: string;
  selectedText: string;
  beforeText: string;
  afterText: string;
  contextHash: string;
}

export function buildContext(editor: vscode.TextEditor): EditorContext {
  const doc = editor.document;
  const selection = editor.selection;

  const workspace = vscode.workspace.getWorkspaceFolder(doc.uri);
  const workspaceName = workspace?.name ?? '';
  const relativePath = vscode.workspace.asRelativePath(doc.uri, false);

  const selectedText = doc.getText(selection);

  const cursorLine = selection.active.line;
  const startLine = Math.max(0, cursorLine - 30);
  const endLine = Math.min(doc.lineCount - 1, cursorLine + 30);

  const beforeRange = new vscode.Range(new vscode.Position(startLine, 0), selection.start);
  const afterRange = new vscode.Range(selection.end, new vscode.Position(endLine, doc.lineAt(endLine).text.length));

  const beforeText = doc.getText(beforeRange);
  const afterText = doc.getText(afterRange);

  const openFiles = extractOpenFiles(doc.uri);
  const importLines = extractImportLines(doc);

  const rawForHash = `${doc.languageId}\n${workspaceName}\n${relativePath}\n${openFiles}\n${importLines}\n${selectedText}\n${beforeText}\n${afterText}`;
  const contextHash = createHash('sha256').update(rawForHash).digest('hex');

  return {
    languageId: doc.languageId,
    fileName: doc.fileName,
    workspaceName,
    relativePath,
    openFiles,
    importLines,
    selectedText,
    beforeText,
    afterText,
    contextHash
  };
}

function extractOpenFiles(activeUri: vscode.Uri): string {
  const maxEditors = 20;
  const maxChars = 2000;

  const urisFromTabs: vscode.Uri[] = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const uri = getUriFromTabInput(tab.input);
      if (uri) urisFromTabs.push(uri);
      if (urisFromTabs.length >= maxEditors) break;
    }
    if (urisFromTabs.length >= maxEditors) break;
  }

  const urisFromVisibleEditors = vscode.window.visibleTextEditors
    .map((e) => e.document?.uri)
    .filter((u): u is vscode.Uri => !!u);

  const uris = urisFromTabs.length ? urisFromTabs : urisFromVisibleEditors;

  const unique = new Map<string, vscode.Uri>();
  for (const uri of uris) {
    const key = uri.toString();
    if (!unique.has(key)) unique.set(key, uri);
    if (unique.size >= maxEditors) break;
  }

  if (!unique.has(activeUri.toString())) {
    unique.set(activeUri.toString(), activeUri);
  }

  const paths: string[] = [];
  for (const uri of unique.values()) {
    paths.push(vscode.workspace.asRelativePath(uri, false));
    if (paths.join('\n').length >= maxChars) break;
  }

  const joined = paths.join('\n');
  if (joined.length > maxChars) return joined.slice(0, maxChars);
  return joined;
}

function getUriFromTabInput(input: unknown): vscode.Uri | undefined {
  const anyInput = input as any;

  const directUri = anyInput?.uri;
  if (directUri instanceof vscode.Uri) return directUri;

  const modified = anyInput?.modified;
  if (modified instanceof vscode.Uri) return modified;
  if (modified?.uri instanceof vscode.Uri) return modified.uri;

  const original = anyInput?.original;
  if (original instanceof vscode.Uri) return original;
  if (original?.uri instanceof vscode.Uri) return original.uri;

  return undefined;
}

function extractImportLines(doc: vscode.TextDocument): string {
  const maxScanLines = Math.min(doc.lineCount, 80);
  const maxMatches = 40;
  const maxChars = 2000;

  const blocks: string[] = [];

  for (let i = 0; i < maxScanLines; i++) {
    const text = doc.lineAt(i).text;

    const goBlock = tryExtractGoImportBlock(doc.languageId, doc, i, maxScanLines);
    if (goBlock) {
      blocks.push(goBlock.block);
      i = goBlock.endLine;
    } else {
      const stmt = tryExtractMultiLineImportStatement(doc.languageId, doc, i, maxScanLines);
      if (stmt) {
        blocks.push(stmt.block);
        i = stmt.endLine;
      } else if (isImportLine(doc.languageId, text)) {
        blocks.push(text);
      }
    }

    if (blocks.length >= maxMatches) break;
    if (blocks.join('\n').length >= maxChars) break;
  }

  const joined = blocks.join('\n');
  if (joined.length > maxChars) return joined.slice(0, maxChars);
  return joined;
}

function tryExtractGoImportBlock(
  languageId: string,
  doc: vscode.TextDocument,
  startLine: number,
  maxScanLines: number
): { block: string; endLine: number } | undefined {
  if (languageId !== 'go') return undefined;

  const first = doc.lineAt(startLine).text;
  if (!/^\s*import\s*\(\s*$/.test(first)) return undefined;

  const lines: string[] = [first];
  let endLine = startLine;
  for (let i = startLine + 1; i < maxScanLines; i++) {
    const t = doc.lineAt(i).text;
    lines.push(t);
    endLine = i;
    if (/^\s*\)\s*$/.test(t)) break;
    if (lines.join('\n').length >= 2000) break;
  }

  return { block: lines.join('\n'), endLine };
}

function tryExtractMultiLineImportStatement(
  languageId: string,
  doc: vscode.TextDocument,
  startLine: number,
  maxScanLines: number
): { block: string; endLine: number } | undefined {
  const first = doc.lineAt(startLine).text;
  const trimmed = first.trim();

  if (trimmed.startsWith('//') || trimmed.startsWith('#')) return undefined;

  const isStart =
    (languageId !== 'python' && /^(import|export|use|extern\s+crate|using|require\b)/.test(trimmed)) ||
    (languageId === 'dart' && /^(import|export|part)\b/.test(trimmed));

  if (!isStart) return undefined;

  const mayContinue =
    !/;\s*$/.test(trimmed) &&
    (/[({\[]\s*$/.test(trimmed) || trimmed.includes('{') || trimmed.includes('(') || languageId === 'dart' || languageId === 'rust');

  if (!mayContinue) return undefined;

  const lines: string[] = [first];
  let endLine = startLine;
  let depth = computeBracketDepthDelta(first);

  for (let i = startLine + 1; i < maxScanLines; i++) {
    const t = doc.lineAt(i).text;
    const tr = t.trim();
    if (tr.startsWith('//')) break;

    lines.push(t);
    endLine = i;
    depth += computeBracketDepthDelta(t);

    if (/;\s*$/.test(tr) && depth <= 0) break;
    if (languageId === 'dart' && /;\s*$/.test(tr)) break;
    if (lines.join('\n').length >= 2000) break;
  }

  if (lines.length <= 1) return undefined;
  return { block: lines.join('\n'), endLine };
}

function computeBracketDepthDelta(line: string): number {
  const t = line.replace(/(['"]).*?\1/g, '');
  let delta = 0;
  for (const ch of t) {
    if (ch === '{' || ch === '(' || ch === '[') delta++;
    else if (ch === '}' || ch === ')' || ch === ']') delta--;
  }
  return delta;
}

function isImportLine(languageId: string, line: string): boolean {
  const t = line.trim();
  if (!t) return false;

  if (t.startsWith('//')) return false;

  if (t.startsWith('#')) {
    if (/(^#\s*include\s*(<[^>]+>|"[^"]+"))/i.test(t)) return true;
    return false;
  }

  if (languageId === 'python') {
    return /^import\s+\S+/.test(t) || /^from\s+\S+\s+import\s+\S+/.test(t);
  }

  if (languageId === 'go') {
    return /^import\s+\(?\s*"[^"]+"/.test(t) || /^import\s+\(?\s*[A-Za-z0-9_\.]+\s+"[^"]+"/.test(t);
  }

  if (languageId === 'java' || languageId === 'kotlin' || languageId === 'scala') {
    return /^import\s+[\w\.\*]+\s*;?$/.test(t);
  }

  if (languageId === 'csharp') {
    return /^using\s+[\w\.]+\s*;?$/.test(t) || /^using\s+static\s+[\w\.]+\s*;?$/.test(t);
  }

  if (languageId === 'swift') {
    return /^import\s+[A-Za-z_][A-Za-z0-9_]*\s*$/.test(t);
  }

  if (languageId === 'dart') {
    return /^(import|export|part)\s+['"][^'"]+['"]\s*;?$/.test(t) || /^part\s+of\s+/.test(t);
  }

  if (languageId === 'rust') {
    return /^(use|extern\s+crate)\s+/.test(t);
  }

  if (languageId === 'php') {
    return /^(use\s+[A-Za-z_\\][A-Za-z0-9_\\]*\s*;)/.test(t) || /^(require|require_once|include|include_once)\s*\(?\s*['"][^'"]+['"]/.test(t);
  }

  if (languageId === 'ruby') {
    return /^(require|require_relative|load)\s+['"][^'"]+['"]/.test(t);
  }

  if (languageId === 'lua') {
    return /\brequire\s*\(\s*['"][^'"]+['"]\s*\)/.test(t) || /^require\s+['"][^'"]+['"]/.test(t);
  }

  return (
    /^import\s+.*from\s+['"][^'"]+['"]\s*;?$/.test(t) ||
    /^import\s+['"][^'"]+['"]\s*;?$/.test(t) ||
    /\brequire\(\s*['"][^'"]+['"]\s*\)/.test(t)
  );
}
