import * as vscode from 'vscode';
import { getSettings } from '../config/settings';
import { MemoryStore } from '../memory/store';

export async function openMemoryCommand(context: vscode.ExtensionContext) {
  const settings = getSettings();
  if (!settings.memory.enabled) {
    vscode.window.showInformationMessage('ANGO IA: Memory is disabled in settings.');
    return;
  }

  const store = new MemoryStore(context, { enabled: settings.memory.enabled });
  const data = await store.exportJson();
  const sanitized =
    settings.memory.storeRawContext
      ? data
      : {
          ...data,
          interactions: (data.interactions as Array<Record<string, unknown>>).map((i) => {
            const { raw_context: _raw, ...rest } = i as Record<string, unknown> & { raw_context?: unknown };
            return rest;
          })
        };

  const doc = await vscode.workspace.openTextDocument({
    content: JSON.stringify(sanitized, null, 2),
    language: 'json'
  });

  await vscode.window.showTextDocument(doc, { preview: false });
}
