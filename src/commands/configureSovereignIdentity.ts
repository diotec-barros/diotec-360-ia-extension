import * as vscode from 'vscode';
import { sha512 } from '@noble/hashes/sha512';

const D360_PRIVATE_KEY_SECRET = 'angoIA.diotec360.privateKeyHex';

let ed25519Module: any = null;

async function getEd25519() {
  if (!ed25519Module) {
    ed25519Module = await import('@noble/ed25519');
    const etc = ed25519Module.etc as any;
    if (!etc.sha512Sync) {
      etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed25519Module.etc.concatBytes(...m));
    }
  }
  return ed25519Module;
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

export async function configureSovereignIdentityCommand(context: vscode.ExtensionContext) {
  const value = await vscode.window.showInputBox({
    title: 'DIOTEC 360: Configure Sovereign Identity',
    prompt: 'Paste your ED25519 private key (hex). Leave empty to remove.',
    password: true,
    ignoreFocusOut: true
  });

  if (value === undefined) return;

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    await context.secrets.delete(D360_PRIVATE_KEY_SECRET);
    await vscode.workspace
      .getConfiguration('angoIA')
      .update('diotec360.publicKeyHex', '', vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('DIOTEC 360: Sovereign identity removed.');
    return;
  }

  const ed = await getEd25519();

  const privBytes = hexToBytes(trimmed);
  const pubBytes = await ed.getPublicKeyAsync(privBytes);
  const pubHex = bytesToHex(pubBytes);

  await context.secrets.store(D360_PRIVATE_KEY_SECRET, trimmed);
  await vscode.workspace
    .getConfiguration('angoIA')
    .update('diotec360.publicKeyHex', pubHex, vscode.ConfigurationTarget.Global);

  vscode.window.showInformationMessage('DIOTEC 360: Sovereign identity saved.');
}
