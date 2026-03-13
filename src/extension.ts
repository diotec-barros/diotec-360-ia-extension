import * as vscode from 'vscode';
import { generateCommand } from './commands/generate';
import { explainCommand } from './commands/explain';
import { refactorCommand } from './commands/refactor';
import { chatCommand, clearChatHistoryCommand } from './commands/chat';
import { configureApiKeyCommand } from './commands/configureApiKey';
import { configureAnthropicApiKeyCommand } from './commands/configureAnthropicApiKey';
import { configureSovereignIdentityCommand } from './commands/configureSovereignIdentity';
import { openMemoryCommand } from './commands/openMemory';
import { Output } from './utils/logger';
import { Diotec360SuggestionCodeActionProvider } from './suggestions/codeActions';
import { getLastSuggestion } from './suggestions/store';
import { MemoryStore } from './memory/store';
import { MemorySyncEngine } from './memory/sync_engine';
import { SyncStatusBar } from './ui/syncStatusBar'; // Task 16.3
import { IdleDetector } from './lattice/idleDetector'; // v3.4.0
import { LogicMiner } from './lattice/logicMiner'; // v3.4.0
import { registerCreditPurchaseCommands } from './treasury/creditPurchase.js'; // v3.6.0

// Global sync engine instance (Task 16.2)
let globalSyncEngine: MemorySyncEngine | null = null;

// Global status bar instance (Task 16.3)
let globalStatusBar: SyncStatusBar | null = null;

// Global mining components (v3.4.0)
let globalIdleDetector: IdleDetector | null = null;
let globalLogicMiner: LogicMiner | null = null;

/**
 * Get the global sync engine instance
 * Used by commands to queue interactions for sync after completion
 */
export function getSyncEngine(): MemorySyncEngine | null {
  return globalSyncEngine;
}

/**
 * Get the global status bar instance (Task 16.3)
 * Used to refresh status bar after sync operations
 */
export function getStatusBar(): SyncStatusBar | null {
  return globalStatusBar;
}

/**
 * Get the global idle detector instance (v3.4.0)
 */
export function getIdleDetector(): IdleDetector | null {
  return globalIdleDetector;
}

/**
 * Get the global logic miner instance (v3.4.0)
 */
export function getLogicMiner(): LogicMiner | null {
  return globalLogicMiner;
}

export async function activate(context: vscode.ExtensionContext) {
  const output = new Output('DIOTEC 360 IA');
  output.info('Extension activated');

  // Task 16.2: Initialize sync engine on extension activation
  // Task 16.3: Initialize status bar to show sync status
  try {
    const memoryStore = new MemoryStore(context, { enabled: true });
    
    // Initialize sync engine
    globalSyncEngine = new MemorySyncEngine(memoryStore);
    globalSyncEngine.start();
    output.info('✅ Memory Sync Engine initialized');
    
    // Initialize status bar (Task 16.3)
    globalStatusBar = new SyncStatusBar(memoryStore);
    output.info('✅ DIOTEC 360 Status Bar initialized');
    
    // Add status bar to subscriptions for cleanup
    context.subscriptions.push(globalStatusBar);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    output.error(`⚠️ Failed to initialize Memory Sync Engine: ${errorMessage}`);
    // Continue without sync engine - extension should still work
  }

  // v3.4.0: Initialize Lattice Node Bridge (Idle Mining)
  try {
    const miningEnabled = vscode.workspace.getConfiguration('angoIA').get<boolean>('mining.enabled', true);
    
    if (miningEnabled) {
      // Initialize idle detector
      const idleThreshold = vscode.workspace.getConfiguration('angoIA').get<number>('mining.idleThresholdSeconds', 30);
      globalIdleDetector = new IdleDetector(idleThreshold);
      
      // Initialize logic miner
      globalLogicMiner = new LogicMiner(output);
      await globalLogicMiner.initialize();
      
      // Wire idle detector to logic miner
      globalIdleDetector.onIdleStateChange((isIdle) => {
        if (isIdle && globalLogicMiner) {
          output.info('🌌 User idle detected - starting proof mining');
          globalLogicMiner.startMining();
          
          // Update status bar
          if (globalStatusBar) {
            globalStatusBar.setMiningState(true);
          }
        } else if (!isIdle && globalLogicMiner) {
          output.info('⚡ User activity detected - stopping proof mining');
          globalLogicMiner.stopMining();
          
          // Update status bar
          if (globalStatusBar) {
            globalStatusBar.setMiningState(false);
          }
        }
      });
      
      // Wire mining events to status bar
      if (globalLogicMiner && globalStatusBar) {
        globalLogicMiner.onMiningEvent((event) => {
          if (event.type === 'credits_earned' && globalStatusBar) {
            // Show golden animation
            globalStatusBar.showCreditsEarned(event.data.credits, event.data.total);
            output.info(`💰 Credits earned: ${event.data.credits} (total: ${event.data.total})`);
          } else if (event.type === 'started' && globalStatusBar) {
            globalStatusBar.setMiningState(true);
          } else if (event.type === 'stopped' && globalStatusBar) {
            globalStatusBar.setMiningState(false);
          }
        });
      }
      
      // Start monitoring
      globalIdleDetector.startMonitoring();
      
      output.info('✅ Lattice Node Bridge initialized (v3.4.0)');
      output.info(`   Idle threshold: ${idleThreshold}s`);
      output.info('   Mining will start automatically when idle');
      
      // Add to subscriptions for cleanup
      context.subscriptions.push(globalIdleDetector);
      context.subscriptions.push(globalLogicMiner);
    } else {
      output.info('ℹ️ Proof mining disabled in settings');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    output.error(`⚠️ Failed to initialize Lattice Node Bridge: ${errorMessage}`);
    // Continue without mining - extension should still work
  }

  context.subscriptions.push(
    output,
    vscode.commands.registerCommand('diotec360.generate', () => generateCommand(context, output)),
    vscode.commands.registerCommand('diotec360.explain', () => explainCommand(context, output)),
    vscode.commands.registerCommand('diotec360.refactor', () => refactorCommand(context, output)),
    vscode.commands.registerCommand('diotec360.chat', () => chatCommand(context, output)),
    vscode.commands.registerCommand('diotec360.chatClearHistory', () => clearChatHistoryCommand()),
    vscode.commands.registerCommand('diotec360.applyLastSuggestion', async (uri?: vscode.Uri, range?: vscode.Range) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri) return;

      const suggestion = getLastSuggestion(targetUri);
      if (!suggestion) {
        vscode.window.showInformationMessage('DIOTEC 360 IA: No suggestion available for this file.');
        return;
      }

      const targetRange = range ?? suggestion.range;
      const edit = new vscode.WorkspaceEdit();
      edit.replace(targetUri, targetRange, suggestion.text);
      const ok = await vscode.workspace.applyEdit(edit);
      if (!ok) {
        vscode.window.showErrorMessage('DIOTEC 360 IA: Failed to apply suggestion.');
      }
    }),
    vscode.commands.registerCommand('diotec360.configureApiKey', () => configureApiKeyCommand(context)),
    vscode.commands.registerCommand('diotec360.configureAnthropicApiKey', () => configureAnthropicApiKeyCommand(context)),
    vscode.commands.registerCommand('diotec360.configureSovereignIdentity', () => configureSovereignIdentityCommand(context)),
    vscode.commands.registerCommand('diotec360.openMemory', () => openMemoryCommand(context)),
    vscode.languages.registerCodeActionsProvider(
      [{ scheme: 'file' }, { scheme: 'untitled' }],
      new Diotec360SuggestionCodeActionProvider(),
      { providedCodeActionKinds: Diotec360SuggestionCodeActionProvider.providedCodeActionKinds }
    )
  );
  
  // Register credit purchase commands (v3.6.0 - Global Launch Activation)
  registerCreditPurchaseCommands(context, output);
}

export function deactivate() {
  // Task 16.2: Stop sync engine on deactivation
  if (globalSyncEngine) {
    globalSyncEngine.stop();
  }
  
  // Task 16.3: Dispose status bar on deactivation
  if (globalStatusBar) {
    globalStatusBar.dispose();
  }
  
  // v3.4.0: Cleanup mining components
  if (globalIdleDetector) {
    globalIdleDetector.dispose();
  }
  
  if (globalLogicMiner) {
    globalLogicMiner.dispose();
  }
}
