import * as vscode from 'vscode';

export type ProviderId = 'ollama' | 'openai';

export interface AngoIaSettings {
  enabled: boolean;
  provider: ProviderId;
  streamingEnabled: boolean;
  diotec360: {
    endpoint: string;
    publicKeyHex: string;
  };
  ollama: {
    endpoint: string;
    model: string;
  };
  openai: {
    model: string;
  };
  moe: {
    enabled: boolean;
    writer: {
      provider: ProviderId;
      model: string;
    };
    critic: {
      provider: ProviderId;
      model: string;
      enabledForGenerate: boolean;
      enabledForRefactor: boolean;
      minChars: number;
    };
  };
  memory: {
    enabled: boolean;
    storeRawContext: boolean;
  };
}

export function getSettings(): AngoIaSettings {
  const cfg = vscode.workspace.getConfiguration('angoIA');

  return {
    enabled: cfg.get<boolean>('enabled', true),
    provider: cfg.get<ProviderId>('provider', 'ollama'),
    streamingEnabled: cfg.get<boolean>('streaming.enabled', true),
    diotec360: {
      endpoint: cfg.get<string>('diotec360.endpoint', 'https://diotec-360-diotec-360-ia-judge.hf.space'),
      publicKeyHex: cfg.get<string>('diotec360.publicKeyHex', '')
    },
    ollama: {
      endpoint: cfg.get<string>('ollama.endpoint', 'http://localhost:11434'),
      model: cfg.get<string>('ollama.model', 'llama3')
    },
    openai: {
      model: cfg.get<string>('openai.model', 'gpt-4o-mini')
    },
    moe: {
      enabled: cfg.get<boolean>('moe.enabled', false),
      writer: {
        provider: cfg.get<ProviderId>('moe.writer.provider', cfg.get<ProviderId>('provider', 'ollama')),
        model: cfg.get<string>('moe.writer.model', '')
      },
      critic: {
        provider: cfg.get<ProviderId>('moe.critic.provider', 'openai'),
        model: cfg.get<string>('moe.critic.model', 'gpt-4o-mini'),
        enabledForGenerate: cfg.get<boolean>('moe.critic.enabledForGenerate', true),
        enabledForRefactor: cfg.get<boolean>('moe.critic.enabledForRefactor', true),
        minChars: cfg.get<number>('moe.critic.minChars', 200)
      }
    },
    memory: {
      enabled: cfg.get<boolean>('memory.enabled', true),
      storeRawContext: cfg.get<boolean>('memory.storeRawContext', false)
    }
  };
}
