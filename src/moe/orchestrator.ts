import * as vscode from 'vscode';
import { AngoIaSettings, ProviderId } from '../config/settings';
import { getProvider } from '../llm/router';
import { LLMProvider } from '../llm/provider';
import { EditorContext } from '../prompt/contextBuilder';
import { buildCriticMessages, MoeCriticCommand } from './criticPrompt';
import { Diotec360KernelBridge, Diotec360Rvc } from '../diotec360/kernel_bridge';

export type DualAuditResult = {
  criticReview: string;
  criticRisk: 'low' | 'medium' | 'high' | undefined;
  judgeVerdict: Diotec360Rvc | undefined;
};

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

  async getDualAudit(command: MoeCriticCommand, ctx: EditorContext, writerOutput: string, token: vscode.CancellationToken): Promise<DualAuditResult> {
    // 🏛️ DUAL AUDIT LOOP: Crítico (IA) e Judge (Z3) rodam em PARALELO
    const [criticReview, judgeVerdict] = await Promise.all([
      this.getCriticReview(command, ctx, writerOutput, token).catch((err) => {
        return `[Critic Error: ${err instanceof Error ? err.message : String(err)}]`;
      }),
      this.getJudgeVerdict(writerOutput, token).catch((err) => {
        console.error('Judge verification failed:', err);
        return undefined;
      })
    ]);

    const criticRisk = MoeOrchestrator.parseRiskLevel(criticReview);

    return {
      criticReview,
      criticRisk,
      judgeVerdict
    };
  }

  private async getJudgeVerdict(code: string, token: vscode.CancellationToken): Promise<Diotec360Rvc | undefined> {
    try {
      const bridge = Diotec360KernelBridge.fromSettings(this.context);
      return await bridge.verifyAethel(code, token);
    } catch (err) {
      // Se o Judge não estiver configurado ou o backend não estiver disponível, retorna undefined
      console.warn('DIOTEC 360 Judge not available:', err);
      return undefined;
    }
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
      anthropic: { ...this.settings.anthropic },
      memory: { ...this.settings.memory },
      moe: { ...this.settings.moe }
    };

    if (provider === 'openai') {
      cloned.openai = { ...cloned.openai, model: modelOverride || cloned.openai.model };
    } else if (provider === 'anthropic') {
      cloned.anthropic = { ...cloned.anthropic, model: modelOverride || cloned.anthropic.model };
    } else {
      cloned.ollama = { ...cloned.ollama, model: modelOverride || cloned.ollama.model };
    }

    return getProvider(this.context, cloned);
  }
}
