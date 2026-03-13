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
 * Sync Status Bar - Task 14.1 + Task 16.3 (VISUAL PULSE)
 * 
 * Shows DIOTEC 360 sync status indicator in VS Code status bar.
 * Displays Merkle Root and Sovereign Identity for trust verification.
 */

import * as vscode from 'vscode';
import { MemoryStore } from '../memory/store';

/**
 * DIOTEC 360 Sync Status Bar Item
 * 
 * Visual states:
 * - $(sync~spin) DIOTEC: Syncing... (Active sync)
 * - $(cloud-check) DIOTEC: Synced (Success)
 * - $(cloud-error) DIOTEC: Out of Sync (Failed)
 * - $(cloud) DIOTEC: Ready (Idle)
 * 
 * Tooltip shows:
 * - Sovereign Integrity Status
 * - Last Merkle Root
 * - Sovereign ID
 */
export class SyncStatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private memoryStore: MemoryStore;
    private updateInterval: NodeJS.Timeout | null = null;
    private lastMerkleRoot: string | null = null;
    private sovereignPublicKey: string | null = null;
    
    // v3.4.0: Mining state
    private isMining: boolean = false;
    private totalCreditsEarned: number = 0;
    private lastCreditsEarned: number = 0;
    private creditsAnimationTimeout: NodeJS.Timeout | null = null;
    
    constructor(memoryStore: MemoryStore) {
        this.memoryStore = memoryStore;
        
        // Load sovereign identity
        this.loadSovereignIdentity();
        
        // Create status bar item (Task 14.1 + 16.3)
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100 // High priority - show near the right edge
        );
        
        this.statusBarItem.command = 'diotec360.openMemoryPanel';
        this.statusBarItem.show();
        
        // Start periodic updates
        this.startUpdating();
    }
    
    /**
     * Load sovereign identity from settings (Task 16.3)
     */
    private loadSovereignIdentity(): void {
        const config = vscode.workspace.getConfiguration('angoIA');
        this.sovereignPublicKey = config.get<string>('sovereignIdentity.publicKey') || null;
    }
    
    /**
     * Start periodic status updates
     */
    private startUpdating(): void {
        // Initial update
        this.updateStatus();
        
        // Update every 10 seconds
        this.updateInterval = setInterval(() => {
            this.updateStatus();
        }, 10000);
    }
    
    /**
     * Update status bar with current sync state (Task 14.1 + 16.3)
     * 
     * Shows DIOTEC 360 branding with Merkle Root and Sovereign ID
     */
    private async updateStatus(): Promise<void> {
        try {
            const db = await this.memoryStore.getDatabase();
            
            // Get sync status counts
            const result = db.exec(
                `SELECT 
                    sync_status,
                    synced,
                    COUNT(*) as count
                 FROM interactions
                 GROUP BY sync_status, synced`
            );
            
            // Get last Merkle root (Task 16.3)
            const merkleResult = db.exec(
                `SELECT merkle_root 
                 FROM interactions 
                 WHERE merkle_root IS NOT NULL 
                 ORDER BY timestamp DESC 
                 LIMIT 1`
            );
            
            if (merkleResult.length && merkleResult[0].values.length) {
                this.lastMerkleRoot = merkleResult[0].values[0][0] as string;
            }
            
            if (!result.length) {
                this.statusBarItem.text = '$(cloud) DIOTEC: Ready';
                this.statusBarItem.tooltip = this.buildTooltip(0, 0, 0, 0);
                return;
            }
            
            const { columns, values } = result[0];
            
            let syncedCount = 0;
            let syncingCount = 0;
            let pendingCount = 0;
            let failedCount = 0;
            
            for (const row of values) {
                const obj: Record<string, any> = {};
                for (let i = 0; i < columns.length; i++) {
                    obj[columns[i] ?? String(i)] = row[i];
                }
                
                const status = obj.sync_status || (obj.synced ? 'synced' : 'local_only');
                const count = obj.count || 0;
                
                if (status === 'synced') {
                    syncedCount += count;
                } else if (status === 'syncing') {
                    syncingCount += count;
                } else if (status === 'sync_failed') {
                    failedCount += count;
                } else {
                    pendingCount += count;
                }
            }
            
            // Determine icon and text (Task 16.3 - DIOTEC 360 branding)
            let icon = '$(cloud)';
            let text = 'DIOTEC: Ready';
            
            // v3.4.0: Mining state takes priority
            if (this.isMining) {
                icon = '$(sync~spin)';
                text = 'DIOTEC: Mining Truth';
            } else if (failedCount > 0) {
                icon = '$(cloud-error)';
                text = `DIOTEC: Out of Sync`;
            } else if (syncingCount > 0) {
                icon = '$(sync~spin)';
                text = `DIOTEC: Syncing...`;
            } else if (pendingCount > 0) {
                icon = '$(cloud-upload)';
                text = `DIOTEC: ${pendingCount} Pending`;
            } else if (syncedCount > 0) {
                icon = '$(cloud-check)';
                text = `DIOTEC: Synced`;
            }
            
            this.statusBarItem.text = `${icon} ${text}`;
            this.statusBarItem.tooltip = this.buildTooltip(syncedCount, syncingCount, pendingCount, failedCount);
            
        } catch (error) {
            console.error('[SYNC STATUS BAR] Error updating status:', error);
            this.statusBarItem.text = '$(error) DIOTEC: Error';
            this.statusBarItem.tooltip = 'Error checking sync status\nClick to view details';
        }
    }
    
    /**
     * Build rich tooltip with Merkle Root and Sovereign ID (Task 16.3)
     */
    private buildTooltip(synced: number, syncing: number, pending: number, failed: number): string {
        const lines: string[] = [];
        
        // Header
        lines.push('🏛️ DIOTEC 360 IA - Sovereign Integrity');
        lines.push('');
        
        // Sync status
        if (failed > 0) {
            lines.push(`❌ ${failed} interaction(s) failed to sync`);
        } else if (syncing > 0) {
            lines.push(`⏳ ${syncing} interaction(s) syncing...`);
        } else if (pending > 0) {
            lines.push(`⚠️ ${pending} interaction(s) pending sync`);
        } else if (synced > 0) {
            lines.push(`✅ ${synced} interaction(s) synced`);
        } else {
            lines.push('✅ Sovereign Integrity Verified');
        }
        
        lines.push('');
        
        // Merkle Root (Task 16.3)
        if (this.lastMerkleRoot) {
            const shortRoot = this.lastMerkleRoot.substring(0, 16) + '...';
            lines.push(`📜 Last Merkle Root: ${shortRoot}`);
        } else {
            lines.push('📜 Last Merkle Root: (none)');
        }
        
        lines.push('');
        
        // Sovereign ID (Task 16.3)
        if (this.sovereignPublicKey) {
            const shortId = this.sovereignPublicKey.substring(0, 16) + '...';
            lines.push(`🔑 Sovereign ID: ${shortId}`);
        } else {
            lines.push('🔑 Sovereign ID: (not configured)');
            lines.push('');
            lines.push('⚠️ Configure sovereign identity to enable sync');
        }
        
        // v3.4.0: Mining stats
        if (this.totalCreditsEarned > 0) {
            lines.push('');
            lines.push(`💰 Total Credits Earned: ${this.totalCreditsEarned}`);
        }
        
        if (this.isMining) {
            lines.push('');
            lines.push('⚡ Mining proofs in background...');
        }
        
        lines.push('');
        lines.push('💡 Click to view memory panel');
        
        return lines.join('\n');
    }
    
    /**
     * v3.4.0: Set mining state
     */
    public setMiningState(isMining: boolean): void {
        this.isMining = isMining;
        this.updateStatus();
    }
    
    /**
     * v3.4.0: Show credits earned animation
     */
    public showCreditsEarned(credits: number, totalCredits: number): void {
        this.lastCreditsEarned = credits;
        this.totalCreditsEarned = totalCredits;
        
        // Clear any existing animation
        if (this.creditsAnimationTimeout) {
            clearTimeout(this.creditsAnimationTimeout);
        }
        
        // Show golden star animation for 3 seconds
        this.statusBarItem.text = `$(star-full) DIOTEC: +${credits} Credits`;
        this.statusBarItem.tooltip = this.buildTooltip(0, 0, 0, 0);
        
        // Return to normal state after 3 seconds
        this.creditsAnimationTimeout = setTimeout(() => {
            this.updateStatus();
            this.creditsAnimationTimeout = null;
        }, 3000);
    }
    
    /**
     * Manually trigger status update (Task 16.3)
     * 
     * Called by sync engine when sync completes
     */
    public refresh(): void {
        this.updateStatus();
    }
    
    /**
     * Dispose status bar item
     */
    public dispose(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.creditsAnimationTimeout) {
            clearTimeout(this.creditsAnimationTimeout);
            this.creditsAnimationTimeout = null;
        }
        
        this.statusBarItem.dispose();
    }
}
