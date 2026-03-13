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
 * Restore Memory from Cloud Command - Task 13
 * 
 * Allows users to restore their interaction history from DIOTEC 360 backend
 * to a new device or after reinstalling the extension.
 */

import * as vscode from 'vscode';
import { MemoryStore } from '../memory/store';
import { MemoryBridgeClient } from '../memory/bridge_client';

/**
 * Restore interaction history from cloud (Task 13.1)
 */
export async function restoreMemoryFromCloud(
    context: vscode.ExtensionContext,
    memoryStore: MemoryStore
): Promise<void> {
    try {
        // Get sovereign identity from settings
        const config = vscode.workspace.getConfiguration('angoIA');
        const publicKeyHex = config.get<string>('sovereignIdentity.publicKey');
        
        if (!publicKeyHex) {
            vscode.window.showErrorMessage(
                'Sovereign identity not configured. Please run "Ango IA: Configure Sovereign Identity" first.'
            );
            return;
        }
        
        // Confirm with user (Task 13.1)
        const confirm = await vscode.window.showWarningMessage(
            'This will merge cloud interactions with your local data. Continue?',
            { modal: true },
            'Yes, Restore',
            'Cancel'
        );
        
        if (confirm !== 'Yes, Restore') {
            return;
        }
        
        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Restoring interactions from cloud',
                cancellable: false
            },
            async (progress) => {
                // Initialize bridge client
                const serverUrl = config.get<string>('diotec360.serverUrl') || 'https://diotec360.hf.space';
                const bridgeClient = new MemoryBridgeClient(serverUrl);
                
                let totalRestored = 0;
                let totalSkipped = 0;
                let totalConflicts = 0;
                let page = 1;
                const limit = 100;
                
                // Fetch all pages (Task 13.4)
                while (true) {
                    progress.report({
                        message: `Fetching page ${page}...`,
                        increment: 10
                    });
                    
                    const response = await bridgeClient.getInteractions(publicKeyHex, page, limit);
                    
                    if (response.interactions.length === 0) {
                        break;
                    }
                    
                    // Merge interactions (Task 13.2)
                    for (const remoteInteraction of response.interactions) {
                        const result = await mergeInteraction(memoryStore, remoteInteraction);
                        
                        if (result === 'restored') {
                            totalRestored++;
                        } else if (result === 'skipped') {
                            totalSkipped++;
                        } else if (result === 'conflict') {
                            totalConflicts++;
                        }
                    }
                    
                    progress.report({
                        message: `Restored ${totalRestored} interactions...`
                    });
                    
                    // Check if we've fetched all interactions
                    if (response.interactions.length < limit) {
                        break;
                    }
                    
                    page++;
                }
                
                // Show summary (Task 13.4)
                const summary = [
                    `✅ Restored ${totalRestored} interactions from cloud`,
                    totalSkipped > 0 ? `⏭️ Skipped ${totalSkipped} (already synced)` : null,
                    totalConflicts > 0 ? `⚠️ ${totalConflicts} conflicts (kept local version)` : null
                ].filter(Boolean).join('\n');
                
                vscode.window.showInformationMessage(summary);
            }
        );
        
    } catch (error: any) {
        console.error('[RESTORE] Error restoring from cloud:', error);
        vscode.window.showErrorMessage(`Failed to restore from cloud: ${error.message}`);
    }
}

/**
 * Merge remote interaction with local database (Task 13.2)
 * 
 * @returns 'restored' if new interaction was added, 'skipped' if already exists with same content, 'conflict' if content differs
 */
async function mergeInteraction(
    memoryStore: MemoryStore,
    remoteInteraction: any
): Promise<'restored' | 'skipped' | 'conflict'> {
    const db = await memoryStore.getDatabase();
    
    // Check if interaction exists locally
    const result = db.exec(
        `SELECT * FROM interactions WHERE id = ? LIMIT 1`,
        [remoteInteraction.interaction_id]
    );
    
    if (result.length > 0 && result[0].values.length > 0) {
        // Interaction exists - check if content matches (Task 13.2)
        const { columns, values } = result[0];
        const row = values[0];
        
        const obj: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
            obj[columns[i] ?? String(i)] = row[i];
        }
        
        // Compare key fields
        const localHash = obj.context_hash;
        const remoteHash = remoteInteraction.context_hash;
        
        if (localHash === remoteHash) {
            // Content matches - update sync status to 'synced' (Task 13.2)
            db.run(
                `UPDATE interactions 
                 SET synced = 1, 
                     sync_status = 'synced', 
                     merkle_root = ? 
                 WHERE id = ?`,
                [remoteInteraction.merkle_proof.root_hash, remoteInteraction.interaction_id]
            );
            
            return 'skipped';
        } else {
            // Content differs - log conflict and keep local version (Task 13.2)
            console.warn(`[RESTORE] Conflict detected for interaction ${remoteInteraction.interaction_id}`);
            console.warn(`[RESTORE] Local hash: ${localHash}, Remote hash: ${remoteHash}`);
            console.warn(`[RESTORE] Keeping local version`);
            
            return 'conflict';
        }
    }
    
    // Interaction doesn't exist - insert it (Task 13.2)
    db.run(
        `INSERT INTO interactions (
            id, timestamp, provider, model, command, 
            context_hash, response_chars, 
            judge_verdict, judge_message,
            synced, sync_status, merkle_root, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced', ?, 'completed')`,
        [
            remoteInteraction.interaction_id,
            remoteInteraction.timestamp,
            remoteInteraction.critic_provider,
            remoteInteraction.critic_model,
            remoteInteraction.command,
            remoteInteraction.context_hash,
            remoteInteraction.response_size,
            remoteInteraction.judge_verdict,
            remoteInteraction.judge_message,
            remoteInteraction.merkle_proof.root_hash
        ]
    );
    
    return 'restored';
}
