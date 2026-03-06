import * as vscode from 'vscode';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

const D360_PRIVATE_KEY_SECRET = 'angoIA.diotec360.privateKeyHex';

function ensureNobleReady() {
  if (!ed.etc.sha512Sync) {
    ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));
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

  ensureNobleReady();

  const privBytes = hexToBytes(trimmed);
  const pubBytes = await ed.getPublicKeyAsync(privBytes);
  const pubHex = bytesToHex(pubBytes);

  await context.secrets.store(D360_PRIVATE_KEY_SECRET, trimmed);
  await vscode.workspace
    .getConfiguration('angoIA')
    .update('diotec360.publicKeyHex', pubHex, vscode.ConfigurationTarget.Global);

  vscode.window.showInformationMessage('DIOTEC 360: Sovereign identity saved.');
}
