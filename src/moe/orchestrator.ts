import * as vscode from 'vscode';
import { AngoIaSettings, ProviderId } from '../config/settings';
import { getProvider } from '../llm/router';
import { LLMProvider } from '../llm/provider';
import { EditorContext } from '../prompt/contextBuilder';
import { buildCriticMessages, MoeCriticCommand } from './criticPrompt';

export class MoeOrchestrator {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly settings: AngoIaSettings
  ) {}

  isEnabled(): boolean {
    return !!this.settings.moe?.enabled;
  }

  shouldRunCritic(command: MoeCriticCommand, writerOutput: string): boolean {
    if (!this.isEnabled()) return false;

    const critic = this.settings.moe.critic;
    if (command === 'generate' && !critic.enabledForGenerate) return false;
    if (command === 'refactor' && !critic.enabledForRefactor) return false;

    if (writerOutput.length < critic.minChars) return false;
    return true;
  }

  async getWriterProvider(): Promise<LLMProvider> {
    const writer = this.settings.moe.writer;
    const modelOverride = writer.model && writer.model.trim().length ? writer.model.trim() : undefined;
    return this.getExpertProvider(writer.provider, modelOverride);
  }

  async getCriticReview(command: MoeCriticCommand, ctx: EditorContext, writerOutput: string, token: vscode.CancellationToken): Promise<string> {
    const criticProvider = await this.getExpertProvider(
      this.settings.moe.critic.provider,
      this.settings.moe.critic.model
    );

    const messages = buildCriticMessages(command, ctx, writerOutput);
    return criticProvider.generate({ messages }, token);
  }

  static appendReviewMarkdown(writerOutput: string, reviewMarkdown: string): string {
    const cleanedReview = reviewMarkdown.trim();
    if (!cleanedReview) return writerOutput;
    return [writerOutput, '', '---', '', '## MOE Review', cleanedReview].join('\n');
  }

  static parseRiskLevel(reviewMarkdown: string): 'low' | 'medium' | 'high' | undefined {
    const text = reviewMarkdown.replaceAll('\r\n', '\n');
    const m = text.match(/(^|\n)##\s*Risk\s*\n\s*(low|medium|high)\b/i);
    if (!m?.[2]) return undefined;
    const v = m[2].toLowerCase();
    if (v === 'low' || v === 'medium' || v === 'high') return v;
    return undefined;
  }

  private async getExpertProvider(provider: ProviderId, modelOverride?: string): Promise<LLMProvider> {
    const cloned: AngoIaSettings = {
      ...this.settings,
      provider,
      ollama: { ...this.settings.ollama },
      openai: { ...this.settings.openai },
      memory: { ...this.settings.memory },
      moe: { ...this.settings.moe }
    };

    if (provider === 'openai') {
      cloned.openai = { ...cloned.openai, model: modelOverride || cloned.openai.model };
    } else {
      cloned.ollama = { ...cloned.ollama, model: modelOverride || cloned.ollama.model };
    }

    return getProvider(this.context, cloned);
  }
}
