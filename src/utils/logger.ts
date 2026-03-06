import * as vscode from 'vscode';

export class Output implements vscode.Disposable {
  private readonly channel: vscode.OutputChannel;

  constructor(name: string) {
    this.channel = vscode.window.createOutputChannel(name);
  }

  info(message: string) {
    this.channel.appendLine(`[info] ${message}`);
  }

  warn(message: string) {
    this.channel.appendLine(`[warn] ${message}`);
  }

  error(message: string) {
    this.channel.appendLine(`[error] ${message}`);
  }

  show(preserveFocus = true) {
    this.channel.show(preserveFocus);
  }

  dispose() {
    this.channel.dispose();
  }
}
