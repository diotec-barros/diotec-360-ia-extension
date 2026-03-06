import * as vscode from 'vscode';
import { LLMChunk, LLMProvider, GenerateRequest } from '../provider';

interface OllamaStreamChunk {
  response?: string;
  done?: boolean;
}

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly model: string;

  private constructor(private readonly endpoint: string, model: string) {
    this.model = model;
  }

  static async create(settings: { ollama: { endpoint: string; model: string } }): Promise<OllamaProvider> {
    return new OllamaProvider(settings.ollama.endpoint, settings.ollama.model);
  }

  async generate(request: GenerateRequest, token: vscode.CancellationToken): Promise<string> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const url = `${this.endpoint.replace(/\/$/, '')}/api/chat`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: request.messages
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await safeReadText(res);
      throw new Error(`Ollama error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      message?: { content?: string };
      response?: string;
    };

    return json.message?.content ?? json.response ?? '';
  }

  async *generateStream(request: GenerateRequest, token: vscode.CancellationToken): AsyncIterable<LLMChunk> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const url = `${this.endpoint.replace(/\/$/, '')}/api/chat`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: request.messages
      }),
      signal: controller.signal
    });

    if (!res.ok || !res.body) {
      const text = await safeReadText(res);
      throw new Error(`Ollama error (${res.status}): ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let idx: number;

      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        const chunk = JSON.parse(line) as OllamaStreamChunk;
        if (chunk.response) {
          yield { type: 'delta', text: chunk.response };
        }
        if (chunk.done) {
          yield { type: 'done' };
          return;
        }
      }
    }

    yield { type: 'done' };
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
