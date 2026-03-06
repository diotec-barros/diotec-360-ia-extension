import * as vscode from 'vscode';
import { HLJS_THEME_CSS } from './hljsTheme';
import { renderMarkdownToHtml } from './markdownRenderer';

type PanelAction = 'accept' | 'copy' | 'copyMarkdown' | 'reject' | 'cancel';
type PanelMessage =
  | { type: PanelAction }
  | { type: 'edit'; text: string }
  | { type: 'openLink'; href: string };

export class PreviewPanel {
  private static instance: PreviewPanel | undefined;

  private content = '';
  private renderedHtml = '';
  private moeReviewHtml = '';
  private moeRisk: 'low' | 'medium' | 'high' | '' = '';
  private renderedHtmlTimer: NodeJS.Timeout | undefined;
  private pendingRenderedHtml: string | undefined;
  private status = '';
  private cts: vscode.CancellationTokenSource | undefined;

  private acceptHandlers: Array<() => Promise<void> | void> = [];
  private copyHandlers: Array<() => Promise<void> | void> = [];
  private copyMarkdownHandlers: Array<() => Promise<void> | void> = [];
  private rejectHandlers: Array<() => Promise<void> | void> = [];
  private cancelHandlers: Array<() => Promise<void> | void> = [];

  private constructor(private readonly panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [extensionUri]
    };

    this.panel.onDidDispose(() => {
      this.acceptHandlers = [];
      this.copyHandlers = [];
      this.copyMarkdownHandlers = [];
      this.rejectHandlers = [];
      this.cancelHandlers = [];
      this.cts?.dispose();
      this.cts = undefined;

      if (this.renderedHtmlTimer) {
        clearTimeout(this.renderedHtmlTimer);
        this.renderedHtmlTimer = undefined;
      }
      this.pendingRenderedHtml = undefined;

      PreviewPanel.instance = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (msg: PanelMessage) => {
      if (msg.type === 'edit') {
        this.content = msg.text;
        this.setRenderedHtmlDebounced(renderMarkdownToHtml(this.content));
        this.postState();
        return;
      }

      if (msg.type === 'cancel') {
        for (const h of this.cancelHandlers) await h();
        this.cts?.cancel();
        return;
      }

      if (msg.type === 'openLink') {
        try {
          await vscode.env.openExternal(vscode.Uri.parse(msg.href));
        } catch {
          // ignore
        }
        return;
      }

      if (msg.type === 'accept') {
        for (const h of this.acceptHandlers) await h();
      }

      if (msg.type === 'copy') {
        for (const h of this.copyHandlers) await h();
      }

      if (msg.type === 'copyMarkdown') {
        for (const h of this.copyMarkdownHandlers) await h();
      }

      if (msg.type === 'reject') {
        for (const h of this.rejectHandlers) await h();
      }
    });

    this.render();
  }

  static getOrCreate(extensionUri: vscode.Uri): PreviewPanel {
    if (PreviewPanel.instance) return PreviewPanel.instance;

    const panel = vscode.window.createWebviewPanel(
      'angoIAPreview',
      'ANGO IA',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    PreviewPanel.instance = new PreviewPanel(panel, extensionUri);
    return PreviewPanel.instance;
  }

  reveal() {
    this.panel.reveal(vscode.ViewColumn.Beside, true);
  }

  setTitle(title: string) {
    this.panel.title = title;
  }

  bindCancellation(cts: vscode.CancellationTokenSource) {
    this.cts?.dispose();
    this.cts = cts;
  }

  setStatus(status: string) {
    this.status = status;
    this.postState();
  }

  setContent(text: string) {
    this.content = text;
    this.postState();
  }

  appendContent(delta: string) {
    this.content += delta;
    this.postState();
  }

  setRenderedHtml(html: string) {
    this.renderedHtml = html;
    this.postState();
  }

  setMoeReview(reviewMarkdown: string, risk?: 'low' | 'medium' | 'high') {
    this.moeReviewHtml = reviewMarkdown ? renderMarkdownToHtml(reviewMarkdown) : '';
    this.moeRisk = risk ?? '';
    this.postState();
  }

  clearMoeReview() {
    this.moeReviewHtml = '';
    this.moeRisk = '';
    this.postState();
  }

  setRenderedHtmlDebounced(html: string, delayMs = 60) {
    this.pendingRenderedHtml = html;

    if (this.renderedHtmlTimer) {
      clearTimeout(this.renderedHtmlTimer);
    }

    this.renderedHtmlTimer = setTimeout(() => {
      this.renderedHtmlTimer = undefined;
      if (this.pendingRenderedHtml !== undefined) {
        this.setRenderedHtml(this.pendingRenderedHtml);
        this.pendingRenderedHtml = undefined;
      }
    }, delayMs);
  }

  flushRenderedHtml() {
    if (this.renderedHtmlTimer) {
      clearTimeout(this.renderedHtmlTimer);
      this.renderedHtmlTimer = undefined;
    }

    if (this.pendingRenderedHtml !== undefined) {
      this.setRenderedHtml(this.pendingRenderedHtml);
      this.pendingRenderedHtml = undefined;
    }
  }

  getContent() {
    return this.content;
  }

  onAccept(handler: () => Promise<void> | void) {
    this.acceptHandlers = [handler];
    this.postState();
  }

  onCopy(handler: () => Promise<void> | void) {
    this.copyHandlers = [handler];
    this.postState();
  }

  onCopyMarkdown(handler: () => Promise<void> | void) {
    this.copyMarkdownHandlers = [handler];
    this.postState();
  }

  onReject(handler: () => Promise<void> | void) {
    this.rejectHandlers = [handler];
    this.postState();
  }

  onCancel(handler: () => Promise<void> | void) {
    this.cancelHandlers = [handler];
    this.postState();
  }

  private postState() {
    this.panel.webview.postMessage({
      type: 'state',
      content: this.content,
      html: this.renderedHtml,
      moeReviewHtml: this.moeReviewHtml,
      moeRisk: this.moeRisk,
      status: this.status
    });
  }

  private render() {
    const nonce = String(Date.now());

    this.panel.webview.html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ANGO IA</title>
<style>
  body { font-family: var(--vscode-font-family); padding: 12px; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
  button { padding: 6px 10px; }
  #status { opacity: 0.8; }
  #editor { width: 100%; min-height: 160px; box-sizing: border-box; resize: vertical; padding: 10px; margin: 0 0 10px; border-radius: 6px; border: 1px solid var(--vscode-editorWidget-border); background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-editor-font-family); font-size: var(--vscode-editor-font-size); }
  #out { word-break: break-word; background: var(--vscode-editor-background); border: 1px solid var(--vscode-editorWidget-border); padding: 10px; border-radius: 6px; }
  #out pre { white-space: pre; overflow-x: auto; background: transparent; border: none; padding: 0; margin: 10px 0; }
  #out code { font-family: var(--vscode-editor-font-family); font-size: var(--vscode-editor-font-size); }
  #out pre code { display: block; }
  #out h1, #out h2, #out h3 { margin: 14px 0 8px; }
  #out ul { margin: 8px 0 8px 22px; }
  #out ol { margin: 8px 0 8px 22px; }
  #out blockquote { border-left: 3px solid var(--vscode-textBlockQuote-border); margin: 8px 0; padding: 6px 10px; background: var(--vscode-textBlockQuote-background); }
  #out a { color: var(--vscode-textLink-foreground); }
  #moeReview { word-break: break-word; background: var(--vscode-editor-background); border: 1px solid var(--vscode-editorWidget-border); padding: 10px; border-radius: 6px; margin-top: 10px; }
  #moeReviewHeader { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  #moeReviewTitle { font-weight: 600; }
  #moeRiskBadge { display: none; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid var(--vscode-editorWidget-border); }
  #moeRiskBadge.low { display: inline-block; background: rgba(0, 128, 0, 0.12); }
  #moeRiskBadge.medium { display: inline-block; background: rgba(255, 165, 0, 0.14); }
  #moeRiskBadge.high { display: inline-block; background: rgba(255, 0, 0, 0.12); }
  ${HLJS_THEME_CSS}
</style>
</head>
<body>
  <div class="row">
    <button id="accept">Accept & Insert</button>
    <button id="copy">Copy</button>
    <button id="copyMarkdown">Copy as Markdown</button>
    <button id="reject">Reject</button>
    <button id="cancel">Cancel</button>
    <label style="display: inline-flex; align-items: center; gap: 6px;">
      <input id="toggleRender" type="checkbox" checked />
      <span>Render Markdown</span>
    </label>
    <span id="status"></span>
  </div>

  <textarea id="editor" spellcheck="false"></textarea>

  <div id="out"></div>

  <div id="moeReview" style="display:none;">
    <div id="moeReviewHeader">
      <div id="moeReviewTitle">Critic Review</div>
      <div id="moeRiskBadge"></div>
    </div>
    <div id="moeReviewBody"></div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const out = document.getElementById('out');
    const moeReview = document.getElementById('moeReview');
    const moeReviewBody = document.getElementById('moeReviewBody');
    const moeRiskBadge = document.getElementById('moeRiskBadge');
    const status = document.getElementById('status');
    const editor = document.getElementById('editor');

    document.getElementById('accept').addEventListener('click', () => vscode.postMessage({ type: 'accept' }));
    document.getElementById('copy').addEventListener('click', () => vscode.postMessage({ type: 'copy' }));
    document.getElementById('copyMarkdown').addEventListener('click', () => vscode.postMessage({ type: 'copyMarkdown' }));
    document.getElementById('reject').addEventListener('click', () => vscode.postMessage({ type: 'reject' }));
    document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));

    const toggleRender = document.getElementById('toggleRender');
    const applyRenderToggle = () => {
      const enabled = !!toggleRender.checked;
      out.style.display = enabled ? '' : 'none';
    };
    toggleRender.addEventListener('change', applyRenderToggle);
    applyRenderToggle();

    let editTimer;
    editor.addEventListener('input', () => {
      if (editTimer) clearTimeout(editTimer);
      editTimer = setTimeout(() => {
        vscode.postMessage({ type: 'edit', text: editor.value });
      }, 120);
    });

    out.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;
      const link = target.closest && target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      vscode.postMessage({ type: 'openLink', href });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'state') {
        out.innerHTML = msg.html || '';
        status.textContent = msg.status || '';

        const reviewHtml = msg.moeReviewHtml || '';
        if (reviewHtml) {
          moeReview.style.display = '';
          moeReviewBody.innerHTML = reviewHtml;

          const risk = (msg.moeRisk || '').toString();
          const lower = risk.toLowerCase();
          moeRiskBadge.className = '';
          moeRiskBadge.textContent = '';
          if (lower === 'low' || lower === 'medium' || lower === 'high') {
            moeRiskBadge.classList.add(lower);
            moeRiskBadge.textContent = 'Risk: ' + lower.toUpperCase();
          }
        } else {
          moeReview.style.display = 'none';
          moeReviewBody.innerHTML = '';
          moeRiskBadge.className = '';
          moeRiskBadge.textContent = '';
        }

        if (editor.value !== (msg.content || '')) {
          editor.value = msg.content || '';
        }
      }
    });
  </script>
</body>
</html>`;
  }
}
