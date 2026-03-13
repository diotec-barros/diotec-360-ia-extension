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
 * History Recovery - Unified Merkle Memory v3.3.0
 * 
 * Task 13: History Recovery Feature
 * 
 * Allows users to restore their interaction history from the Merkle Tree
 * when setting up on a new device or after data loss.
 */

import * as vscode from 'vscode';
import { MemoryStore } from './store';
import { MemoryBridgeClient } from './bridge_client';

/**
 * History Recovery Manager
 * 
 * Handles downloading and restoring interaction history from backend.
 */
export class HistoryRecoveryManager {
    private memoryStore: MemoryStore;
    private bridgeClient: MemoryBridgeClient;
    
    constructor(memoryStore: MemoryStore, bridgeClient: MemoryBridgeClient) {
        this.memoryStore = memoryStore;
        this.bridgeClient = bridgeClient;
    }
    
    /**
     * Restore interaction history from backend (Task 13.1, 13.2, 13.3)
     * 
     * @param publicKey - User's public key
     * @param progressCallback - Optional callback for progress updates
     * @returns Number of interactions restored
     */
    async restoreHistory(
        publicKey: string,
        progressCallback?: (current: number, total: number) => void
    ): Promise<number> {
        console.log('[HISTORY RECOVERY] Starting history restoration...');
        
        let totalRestored = 0;
        let page = 1;
        const limit = 100;
        
        try {
            // Fetch first page to get total count
            const firstPage = await this.bridgeClient.getInteractions(publicKey, page, limit);
            
            if (!firstPage.ok) {
                throw new Error('Failed to fetch interaction history');
            }
            
            const totalCount = firstPage.total_count;
            console.log(`[HISTORY RECOVERY] Found ${totalCount} interactions to restore`);
            
            // Restore first page
            await this.restoreInteractions(firstPage.interactions);
            totalRestored += firstPage.interactions.length;
            
            if (progressCallback) {
                progressCallback(totalRestored, totalCount);
            }
            
            // Fetch and restore remaining pages
            const totalPages = Math.ceil(totalCount / limit);
            
            for (page = 2; page <= totalPages; page++) {
                const response = await this.bridgeClient.getInteractions(publicKey, page, limit);
                
                if (!response.ok) {
                    console.error(`[HISTORY RECOVERY] Failed to fetch page ${page}`);
                    continue;
                }
                
                await this.restoreInteractions(response.interactions);
                totalRestored += response.interactions.length;
                
                if (progressCallback) {
                    progressCallback(totalRestored, totalCount);
                }
            }
            
            console.log(`[HISTORY RECOVERY] Restored ${totalRestored} interactions`);
            return totalRestored;
            
        } catch (error) {
            console.error('[HISTORY RECOVERY] Error restoring history:', error);
            throw error;
        }
    }
    
    /**
     * Restore interactions to SQLite (Task 13.3)
     */
    private async restoreInteractions(interactions: any[]): Promise<void> {
        const db = await this.memoryStore.getDatabase();
        
        for (const interaction of interactions) {
            // Check if interaction already exists
            const existing = db.exec(
                `SELECT id FROM interactions WHERE id = ? LIMIT 1`,
                [interaction.interaction_id]
            );
            
            if (existing.length > 0 && existing[0].values.length > 0) {
                console.log(`[HISTORY RECOVERY] Skipping existing interaction ${interaction.interaction_id}`);
                continue;
            }
            
            // Insert interaction
            db.run(
                `INSERT INTO interactions (
                    id, timestamp, provider, model, command, 
                    context_hash, response_chars, judge_verdict, judge_message,
                    synced, merkle_root, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'synced')`,
                [
                    interaction.interaction_id,
                    interaction.timestamp,
                    interaction.critic_provider,
                    interaction.critic_model,
                    interaction.command,
                    interaction.context_hash,
                    interaction.response_size,
                    interaction.judge_verdict,
                    interaction.judge_message,
                    interaction.merkle_proof.root_hash
                ]
            );
        }
    }
    
    /**
     * Show recovery progress dialog (Task 13.4)
     */
    async showRecoveryDialog(publicKey: string): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Restoring interaction history...',
                cancellable: false
            },
            async (progress) => {
                try {
                    const totalRestored = await this.restoreHistory(
                        publicKey,
                        (current, total) => {
                            const percentage = Math.round((current / total) * 100);
                            progress.report({
                                message: `${current}/${total} interactions (${percentage}%)`,
                                increment: (1 / total) * 100
                            });
                        }
                    );
                    
                    vscode.window.showInformationMessage(
                        `✅ Restored ${totalRestored} interactions from cloud`
                    );
                } catch (error: any) {
                    vscode.window.showErrorMessage(
                        `❌ Failed to restore history: ${error.message}`
                    );
                }
            }
        );
    }
}
