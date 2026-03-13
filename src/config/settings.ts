/**
 * Copyright 2024 Dionísio Sebastião Barros / DIOTEC 360
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Settings - Unified Merkle Memory v3.3.0
 * 
 * Task 15: Configuration Options
 */

import * as vscode from 'vscode';

export type ProviderId = 'ollama' | 'openai' | 'anthropic';

export interface AngoIaSettings {
  enabled: boolean;
  provider: ProviderId;
  streamingEnabled: boolean;
  diotec360: {
    endpoint: string;
    serverUrl: string; // Task 15.1
    publicKeyHex: string;
  };
  ollama: {
    endpoint: string;
    model: string;
  };
  openai: {
    model: string;
  };
  anthropic: {
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
    autoSync: boolean; // Task 15.2
    syncInterval: number; // Task 15.2 (seconds)
  };
  sovereignIdentity: {
    publicKey: string; // Task 15.3
    privateKey: string; // Task 15.3
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
      serverUrl: cfg.get<string>('diotec360.serverUrl', 'https://diotec360.hf.space'), // Task 15.1
      publicKeyHex: cfg.get<string>('diotec360.publicKeyHex', '')
    },
    ollama: {
      endpoint: cfg.get<string>('ollama.endpoint', 'http://localhost:11434'),
      model: cfg.get<string>('ollama.model', 'llama3')
    },
    openai: {
      model: cfg.get<string>('openai.model', 'gpt-4o-mini')
    },
    anthropic: {
      model: cfg.get<string>('anthropic.model', 'claude-3-5-sonnet-20241022')
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
      storeRawContext: cfg.get<boolean>('memory.storeRawContext', false),
      autoSync: cfg.get<boolean>('memory.autoSync', true), // Task 15.2
      syncInterval: cfg.get<number>('memory.syncInterval', 30) // Task 15.2 (30 seconds default)
    },
    sovereignIdentity: {
      publicKey: cfg.get<string>('sovereignIdentity.publicKey', ''), // Task 15.3
      privateKey: cfg.get<string>('sovereignIdentity.privateKey', '') // Task 15.3
    }
  };
}

/**
 * Get configuration value (Task 15.1, 15.2, 15.3)
 */
export function getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration('angoIA');
    return config.get<T>(key, defaultValue);
}

/**
 * Set configuration value (Task 15.1, 15.2, 15.3)
 */
export async function setConfig(key: string, value: any): Promise<void> {
    const config = vscode.workspace.getConfiguration('angoIA');
    await config.update(key, value, vscode.ConfigurationTarget.Global);
}
