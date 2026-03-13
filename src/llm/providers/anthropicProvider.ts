import * as vscode from 'vscode';
import { LLMProvider, GenerateOptions, StreamChunk } from '../provider';

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AnthropicRequest = {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  stream?: boolean;
  temperature?: number;
};

type AnthropicResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

type AnthropicStreamEvent =
  | { type: 'message_start'; message: Partial<AnthropicResponse> }
  | { type: 'content_block_start'; index: number; content_block: { type: 'text'; text: string } }
  | { type: 'content_block_delta'; index: number; delta: { type: 'text_delta'; text: string } }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: { stop_reason: string } }
  | { type: 'message_stop' };

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic';
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly fetchImpl: typeof fetch;

  constructor(apiKey: string, model: string, fetchImpl: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl;
  }

  async generate(options: GenerateOptions, token: vscode.CancellationToken): Promise<string> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const messages = this.convertMessages(options.messages);

    const request: AnthropicRequest = {
      model: this.model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: false
    };

    const response = await this.fetchImpl(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    return data.content.map((c) => c.text).join('');
  }

  async *generateStream(options: GenerateOptions, token: vscode.CancellationToken): AsyncGenerator<StreamChunk> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const messages = this.convertMessages(options.messages);

    const request: AnthropicRequest = {
      model: this.model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true
    };

    const response = await this.fetchImpl(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    if (!response.body) {
      throw new Error('Anthropic API response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data) as AnthropicStreamEvent;

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              yield { type: 'delta', text: event.delta.text };
            }
          } catch (err) {
            console.warn('Failed to parse Anthropic stream event:', err);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }

  private convertMessages(messages: Array<{ role: string; content: string }>): AnthropicMessage[] {
    return messages.map((msg) => ({
      role: msg.role === 'system' || msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
