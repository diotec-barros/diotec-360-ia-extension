import * as vscode from 'vscode';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';

export type Diotec360RpcBadge = 'unverified' | 'syntactically_correct' | 'certified';

type NobleEd25519 = typeof import('@noble/ed25519', {
  with: { 'resolution-mode': 'import' }
});

let nobleEd25519Promise: Promise<NobleEd25519> | undefined;

async function getNobleEd25519() {
  nobleEd25519Promise ??= import('@noble/ed25519');
  return nobleEd25519Promise;
}

export type Diotec360Rvc = {
  ok: boolean;
  badge: Diotec360RpcBadge;
  status: string;
  message: string;
  details?: unknown;
  proof?: unknown;
};

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
};

type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

type JsonRpcResponse<T> =
  | { jsonrpc: '2.0'; id: string; result: T }
  | { jsonrpc: '2.0'; id: string; error: JsonRpcError };

type SovereignAuthEnvelope = {
  publicKeyHex: string;
  timestamp: number;
  nonce: string;
  proofHash: string;
  signatureHex: string;
};

const D360_PRIVATE_KEY_SECRET = 'angoIA.diotec360.privateKeyHex';

async function ensureNobleReady(ed: NobleEd25519) {
  const etc = ed.etc as typeof ed.etc & { sha512Sync?: (...m: Uint8Array[]) => Uint8Array };
  if (!etc.sha512Sync) {
    etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));
  }
}

function hexToBytes(hex: string) {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function utf8Bytes(s: string) {
  return new TextEncoder().encode(s);
}

function sha256Hex(message: string) {
  const digest = sha256(utf8Bytes(message));
  return bytesToHex(digest);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        out[key] = (v as Record<string, unknown>)[key];
      }
      return out;
    }
    return v;
  });
}

export class Diotec360SovereignAuth {
  constructor(private readonly publicKeyHex: string, private readonly privateKeyHex: string) {}

  static async fromVscode(context: vscode.ExtensionContext): Promise<Diotec360SovereignAuth> {
    const cfg = vscode.workspace.getConfiguration('angoIA');
    const pub = cfg.get<string>('diotec360.publicKeyHex', '').trim();
    const priv = (await context.secrets.get(D360_PRIVATE_KEY_SECRET))?.trim();
    if (!pub || !priv) {
      throw new Error('DIOTEC 360 IA sovereign identity not configured.');
    }
    return new Diotec360SovereignAuth(pub, priv);
  }

  async signProofHash(proofHash: string): Promise<string> {
    const ed = await getNobleEd25519();
    await ensureNobleReady(ed);
    const priv = hexToBytes(this.privateKeyHex);
    const sig = await ed.signAsync(utf8Bytes(proofHash), priv);
    return bytesToHex(sig);
  }

  async envelope(payload: unknown): Promise<SovereignAuthEnvelope> {
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();
    const canonical = canonicalJson({ payload, timestamp, nonce, publicKeyHex: this.publicKeyHex });
    const proofHash = sha256Hex(canonical);
    const signatureHex = await this.signProofHash(proofHash);
    return { publicKeyHex: this.publicKeyHex, timestamp, nonce, proofHash, signatureHex };
  }
}

export class Diotec360KernelBridge {
  constructor(
    private readonly endpointBaseUrl: string,
    private readonly auth: Diotec360SovereignAuth,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  static fromSettings(context: vscode.ExtensionContext): Diotec360KernelBridge {
    const cfg = vscode.workspace.getConfiguration('angoIA');
    const endpoint = cfg.get<string>('diotec360.endpoint', 'https://diotec-360-diotec-360-ia-judge.hf.space');
    const base = endpoint.replace(/\/$/, '');

    const authPromise = Diotec360SovereignAuth.fromVscode(context);
    const auth = {
      envelope: async (payload: unknown) => (await authPromise).envelope(payload)
    } as unknown as Diotec360SovereignAuth;

    return new Diotec360KernelBridge(base, auth);
  }

  async verifyAethel(code: string, token: vscode.CancellationToken): Promise<Diotec360Rvc> {
    const params = { code };
    const result = await this.callRpc<Diotec360Rvc>('diotec360.verify', params, token);
    return result;
  }

  private async callRpc<T>(method: string, params: unknown, token: vscode.CancellationToken): Promise<T> {
    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    const rpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params
    };

    const authEnvelope = await this.auth.envelope(rpcRequest);

    const res = await this.fetchImpl(`${this.endpointBaseUrl}/api/rpc`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-diotec360-pubkey': authEnvelope.publicKeyHex,
        'x-diotec360-proofhash': authEnvelope.proofHash,
        'x-diotec360-signature': authEnvelope.signatureHex,
        'x-diotec360-timestamp': String(authEnvelope.timestamp),
        'x-diotec360-nonce': authEnvelope.nonce
      },
      body: JSON.stringify({ request: rpcRequest, auth: authEnvelope }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await safeReadText(res);
      throw new Error(`DIOTEC 360 RPC error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as JsonRpcResponse<T>;

    if ('error' in json) {
      throw new Error(`DIOTEC 360 RPC error (${json.error.code}): ${json.error.message}`);
    }

    return json.result;
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
