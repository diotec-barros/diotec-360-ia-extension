import * as vscode from 'vscode';
import { AngoIaSettings } from '../../config/settings';
import { getOpenAIApiKey } from '../../config/secrets';
import { LLMChunk, LLMProvider, GenerateRequest } from '../provider';

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  readonly model: string;

  private constructor(model: string, private readonly apiKey: string) {
    this.model = model;
  }

  static async create(context: vscode.ExtensionContext, settings: AngoIaSettings): Promise<OpenAIProvider> {
    const apiKey = await getOpenAIApiKey(context);
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Run: ANGO IA: Configure OpenAI API Key');
    }
    return new OpenAIProvider(settings.openai.model, apiKey);
  }

  async generate(request: GenerateRequest, token: vscode.CancellationToken): Promise<string> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: request.messages
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await safeReadText(res);
      throw new Error(`OpenAI error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return json.choices?.[0]?.message?.content ?? '';
  }

  async *generateStream(request: GenerateRequest, token: vscode.CancellationToken): AsyncIterable<LLMChunk> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: request.messages
      }),
      signal: controller.signal
    });

    if (!res.ok || !res.body) {
      const text = await safeReadText(res);
      throw new Error(`OpenAI error (${res.status}): ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const evt of events) {
        const lines = evt.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice('data:'.length).trim();
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };

          const text = json.choices?.[0]?.delta?.content;
          if (text) yield { type: 'delta', text };
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
