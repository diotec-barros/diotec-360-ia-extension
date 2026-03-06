import * as vscode from 'vscode';
import { getSettings } from '../config/settings';
import { buildContext } from '../prompt/contextBuilder';
import { buildMessages } from '../prompt/promptBuilder';
import { getProvider } from '../llm/router';
import { PreviewPanel } from '../ui/previewPanel';
import { renderMarkdownToHtml } from '../ui/markdownRenderer';
import { Output } from '../utils/logger';
import { MemoryStore } from '../memory/store';
import { setLastSuggestion } from '../suggestions/store';
import { MoeOrchestrator } from '../moe/orchestrator';

export async function refactorCommand(context: vscode.ExtensionContext, output: Output) {
  const settings = getSettings();
  if (!settings.enabled) {
    vscode.window.showWarningMessage('ANGO IA is disabled in settings.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const initialRange = new vscode.Range(editor.selection.start, editor.selection.end);

  const panel = PreviewPanel.getOrCreate(context.extensionUri);
  panel.reveal();
  panel.setTitle('ANGO IA: Refactor');
  panel.setContent('');
  panel.setRenderedHtml('');
  panel.clearMoeReview();
  panel.setStatus('Refactoring...');

  const cts = new vscode.CancellationTokenSource();
  panel.bindCancellation(cts);

  const moe = new MoeOrchestrator(context, settings);
  const provider = moe.isEnabled() ? await moe.getWriterProvider() : await getProvider(context, settings);
  const ctx = buildContext(editor);
  const messages = buildMessages('refactor', ctx);

  const memory = new MemoryStore(context, { enabled: settings.memory.enabled });
  const interactionId = await memory.logInteractionStart({
    provider: provider.id,
    model: provider.model,
    command: 'refactor',
    contextHash: ctx.contextHash,
    promptChars: JSON.stringify(messages).length,
    rawContext: settings.memory.storeRawContext ? JSON.stringify({ ctx, messages }) : undefined
  });

  let generatedText = '';

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
    await insertAtSelection(editor, finalText);
    if (finalText !== generatedText) {
      await memory.logDecision(interactionId, 'edited');
    }
    await memory.logDecision(interactionId, 'accepted');
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
    if (settings.streamingEnabled) {
      for await (const chunk of provider.generateStream({ messages }, cts.token)) {
        if (chunk.type === 'delta' && chunk.text) {
          panel.appendContent(chunk.text);
          panel.setRenderedHtmlDebounced(renderMarkdownToHtml(panel.getContent()));
        }
      }
    } else {
      const text = await provider.generate({ messages }, cts.token);
      panel.setContent(text);
      panel.setRenderedHtml(renderMarkdownToHtml(panel.getContent()));
    }

    generatedText = panel.getContent();

    if (moe.shouldRunCritic('refactor', generatedText)) {
      panel.setStatus('Reviewing...');
      const review = await moe.getCriticReview('refactor', ctx, generatedText, cts.token);
      await memory.logDecision(interactionId, 'moe_reviewed');
      const risk = MoeOrchestrator.parseRiskLevel(review);
      if (risk) {
        const decision = risk === 'low' ? 'moe_risk_low' : risk === 'medium' ? 'moe_risk_medium' : 'moe_risk_high';
        await memory.logDecision(interactionId, decision);
      }
      panel.setMoeReview(review, risk);
    }

    setLastSuggestion({
      uri: editor.document.uri,
      range: initialRange,
      text: generatedText,
      source: 'refactor'
    });

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

function sanitizeMarkdown(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  if (match?.[1] !== undefined) return match[1];
  return text;
}
