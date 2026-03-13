import * as vscode from 'vscode';
import { getSettings } from '../config/settings';
import { buildContext } from '../prompt/contextBuilder';
import { buildMessages, ChatMessage } from '../prompt/promptBuilder';
import { getProvider } from '../llm/router';
import { PreviewPanel } from '../ui/previewPanel';
import { renderMarkdownToHtml } from '../ui/markdownRenderer';
import { Output } from '../utils/logger';
import { MemoryStore } from '../memory/store';
import { getSyncEngine } from '../extension'; // Task 16.1: Import sync engine getter

const sessionHistoryByWorkspace = new Map<string, ChatMessage[]>();

export async function clearChatHistoryCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const ctx = buildContext(editor);
  const workspaceKey = `${ctx.workspaceName}:${ctx.relativePath}`;

  const ok = await vscode.window.showWarningMessage(
    `Clear ANGO IA chat history for: ${ctx.relativePath || ctx.fileName}?`,
    { modal: true },
    'Clear'
  );

  if (ok !== 'Clear') return;

  sessionHistoryByWorkspace.delete(workspaceKey);
  vscode.window.showInformationMessage('ANGO IA: Chat history cleared for current file.');
}

export async function chatCommand(context: vscode.ExtensionContext, output: Output) {
  const settings = getSettings();
  if (!settings.enabled) {
    vscode.window.showWarningMessage('ANGO IA is disabled in settings.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const userInput = await vscode.window.showInputBox({
    title: 'ANGO IA: Chat',
    prompt: 'Ask something about the current file/project context.',
    ignoreFocusOut: true
  });

  if (userInput === undefined) return;
  if (userInput.trim().length === 0) return;

  const panel = PreviewPanel.getOrCreate(context.extensionUri);
  panel.reveal();
  panel.setTitle('ANGO IA: Chat');

  const cts = new vscode.CancellationTokenSource();
  panel.bindCancellation(cts);

  const provider = await getProvider(context, settings);
  const ctx = buildContext(editor);

  const workspaceKey = `${ctx.workspaceName}:${ctx.relativePath}`;
  const history = sessionHistoryByWorkspace.get(workspaceKey) ?? [];

  const memory = new MemoryStore(context, { enabled: settings.memory.enabled });

  const baseUser = buildMessages('chat', ctx, { userInput: userInput.trim() });
  const requestMessages: ChatMessage[] = history.length ? [...history, baseUser[1]] : baseUser;

  const interactionId = await memory.logInteractionStart({
    provider: settings.provider,
    model: provider.model,
    command: 'chat',
    contextHash: ctx.contextHash,
    promptChars: JSON.stringify(requestMessages).length,
    rawContext: settings.memory.storeRawContext ? JSON.stringify({ ctx, requestMessages }) : undefined
  });

  let generatedText = '';
  const transcriptBefore = panel.getContent();

  if (!transcriptBefore) {
    panel.setContent('');
    panel.setRenderedHtml('');
  }

  const userBlock = `## User\n${escapeForMarkdown(userInput.trim())}`;
  const assistantHeader = `\n\n## Assistant\n`;

  panel.appendContent((panel.getContent() ? '\n\n' : '') + userBlock + assistantHeader);
  panel.setRenderedHtmlDebounced(renderMarkdownToHtml(panel.getContent()));
  panel.setStatus('Thinking...');

  let interactionEnded = false;
  const endInteraction = async (status: 'completed' | 'cancelled' | 'error') => {
    if (interactionEnded) return;
    interactionEnded = true;
    const finalText = panel.getContent();
    await memory.logInteractionEnd(interactionId, {
      status,
      responseChars: finalText.length
    });
  };

  panel.onAccept(async () => {
    const finalText = panel.getContent();
    const lastAssistant = extractLastAssistant(finalText);
    await insertAtSelection(editor, lastAssistant);
    if (finalText !== generatedText) {
      await memory.logDecision(interactionId, 'edited');
    }
    await memory.logDecision(interactionId, 'accepted');
    
    // Task 16.1: Wire sync engine to Dual Audit completion
    const syncEngine = getSyncEngine();
    if (syncEngine) {
      try {
        syncEngine.queueInteraction(interactionId);
        output.info(`✅ Interaction ${interactionId} queued for sync`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        output.error(`⚠️ Failed to queue interaction for sync: ${errorMessage}`);
      }
    }
  });

  panel.onCopy(async () => {
    const finalText = panel.getContent();
    await vscode.env.clipboard.writeText(finalText);
    if (finalText !== generatedText) {
      await memory.logDecision(interactionId, 'edited');
    }
    await memory.logDecision(interactionId, 'copied');
  });

  panel.onCopyMarkdown(async () => {
    const finalText = panel.getContent();
    await vscode.env.clipboard.writeText(sanitizeMarkdown(finalText));
    if (finalText !== generatedText) {
      await memory.logDecision(interactionId, 'edited');
    }
    await memory.logDecision(interactionId, 'copied');
  });

  panel.onReject(async () => {
    await memory.logDecision(interactionId, 'rejected');
  });

  panel.onCancel(async () => {
    await memory.logDecision(interactionId, 'cancelled');
    await endInteraction('cancelled');
  });

  try {
    const assistantStart = panel.getContent().length;

    if (settings.streamingEnabled) {
      for await (const chunk of provider.generateStream({ messages: requestMessages }, cts.token)) {
        if (chunk.type === 'delta' && chunk.text) {
          panel.appendContent(chunk.text);
          panel.setRenderedHtmlDebounced(renderMarkdownToHtml(panel.getContent()));
        }
      }
    } else {
      const text = await provider.generate({ messages: requestMessages }, cts.token);
      panel.appendContent(text);
      panel.setRenderedHtml(renderMarkdownToHtml(panel.getContent()));
    }

    generatedText = panel.getContent();

    const assistantText = panel.getContent().slice(assistantStart);
    const nextHistory: ChatMessage[] = history.length ? [...history] : [baseUser[0]];
    nextHistory.push({ role: 'user', content: baseUser[1].content });
    nextHistory.push({ role: 'assistant', content: assistantText });
    sessionHistoryByWorkspace.set(workspaceKey, nextHistory);

    panel.setStatus('Done');
    panel.setRenderedHtmlDebounced(renderMarkdownToHtml(panel.getContent()));
    panel.flushRenderedHtml();
    await endInteraction('completed');
  } catch (err) {
    if (cts.token.isCancellationRequested) {
      panel.setStatus('Cancelled');
      await endInteraction('cancelled');
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    output.error(message);
    panel.setStatus('Error');
    panel.appendContent(`\n\n[Error]\n${message}`);
    await endInteraction('error');
  } finally {
    cts.dispose();
  }
}

async function insertAtSelection(editor: vscode.TextEditor, text: string) {
  await editor.edit((editBuilder) => {
    const selection = editor.selection;
    editBuilder.replace(selection, text);
  });
}

function extractLastAssistant(transcript: string): string {
  const idx = transcript.lastIndexOf('## Assistant');
  if (idx < 0) return transcript;
  return transcript.slice(idx + '## Assistant'.length).trimStart();
}

function sanitizeMarkdown(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  if (match?.[1] !== undefined) return match[1];
  return text;
}

function escapeForMarkdown(text: string): string {
  return text.replaceAll('\r\n', '\n');
}
