import * as vscode from 'vscode';
import { ChatMessage } from '../prompt/promptBuilder';

export interface GenerateRequest {
  messages: ChatMessage[];
}

export interface GenerateOptions {
  messages: ChatMessage[];
}

export type LLMChunk =
  | { type: 'delta'; text: string }
  | { type: 'done' };

export type StreamChunk = LLMChunk;

export interface LLMProvider {
  readonly id: string;
  readonly model: string;

  generate(request: GenerateRequest, token: vscode.CancellationToken): Promise<string>;
  generateStream(request: GenerateRequest, token: vscode.CancellationToken): AsyncIterable<LLMChunk>;
}
