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
import { getSyncEngine } from '../extension'; // Task 16.1: Import sync engine getter

export async function generateCommand(context: vscode.ExtensionContext, output: Output) {
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
  panel.setTitle('ANGO IA: Generate');
  panel.setContent('');
  panel.setRenderedHtml('');
  panel.clearMoeReview();
  panel.clearDiotec360Badge();
  panel.setStatus('Generating...');

  const cts = new vscode.CancellationTokenSource();
  panel.bindCancellation(cts);

  const moe = new MoeOrchestrator(context, settings);
  const provider = moe.isEnabled() ? await moe.getWriterProvider() : await getProvider(context, settings);
  const ctx = buildContext(editor);
  const messages = buildMessages('generate', ctx);

  const memory = new MemoryStore(context, { enabled: settings.memory.enabled });
  const interactionId = await memory.logInteractionStart({
    provider: provider.id,
    model: provider.model,
    command: 'generate',
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
    
    // Task 16.1: Wire sync engine to Dual Audit completion
    // After Judge verdict is recorded in SQLite, trigger queueInteraction()
    // Don't block UI while sync happens
    const syncEngine = getSyncEngine();
    if (syncEngine) {
      try {
        syncEngine.queueInteraction(interactionId);
        output.info(`✅ Interaction ${interactionId} queued for sync`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        output.error(`⚠️ Failed to queue interaction for sync: ${errorMessage}`);
        // Continue - sync failure shouldn't block user
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

    if (moe.shouldRunCritic('generate', generatedText)) {
      panel.setStatus('Reviewing...');
      
      // 🏛️ DUAL AUDIT: Crítico (IA) e Judge (Z3) rodam em PARALELO
      const dualAudit = await moe.getDualAudit('generate', ctx, generatedText, cts.token);
      
      await memory.logDecision(interactionId, 'moe_reviewed');
      
      // 🧠 Exibir Crítico (IA)
      if (dualAudit.criticRisk) {
        const decision = dualAudit.criticRisk === 'low' ? 'moe_risk_low' : dualAudit.criticRisk === 'medium' ? 'moe_risk_medium' : 'moe_risk_high';
        await memory.logDecision(interactionId, decision);
      }
      
      // 🏛️ Obter nome do Crítico para exibir na UI
      const criticProvider = await moe.getWriterProvider(); // Usa o mesmo provider do Writer por padrão
      const criticName = `${criticProvider.id === 'anthropic' ? 'Claude' : criticProvider.id === 'openai' ? 'GPT' : 'Llama'} ${criticProvider.model}`;
      
      panel.setMoeReview(dualAudit.criticReview, dualAudit.criticRisk, criticName);
      
      // ⚖️ Exibir Judge (Z3)
      if (dualAudit.judgeVerdict) {
        const verdict = dualAudit.judgeVerdict;
        panel.setDiotec360Badge(verdict.badge, verdict.message);
        
        // 🏛️ CONFLICT RESOLVER: Judge tem prioridade sobre Crítico
        if (verdict.badge === 'unverified' && dualAudit.criticRisk === 'low') {
          const warningMessage = `⚠️ Embora o código pareça limpo (Critic: Low Risk), ele falhou na prova de segurança matemática (Judge: Unverified).\n\n${verdict.message}`;
          panel.setDiotec360Badge('unverified', warningMessage);
        }
      }
    }

    setLastSuggestion({
      uri: editor.document.uri,
      range: initialRange,
      text: generatedText,
      source: 'generate'
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
