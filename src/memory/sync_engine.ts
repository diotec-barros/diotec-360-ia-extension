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
 * Memory Sync Engine - Unified Merkle Memory v3.3.0
 * 
 * Sincroniza memória SQLite local com Merkle Tree remoto (DIOTEC 360).
 * 
 * Features:
 * - Background sync watcher
 * - ED25519 signature authentication
 * - Replay attack prevention (nonce)
 * - Automatic retry with exponential backoff
 * - Offline queue support
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { MemoryStore } from './store';
import { 
    MemoryBridgeClient, 
    InteractionNode, 
    SovereignAuth, 
    NetworkError, 
    NetworkErrorType 
} from './bridge_client';

/**
 * Memory Sync Engine
 * 
 * Watches SQLite for new interactions and syncs to Merkle Tree.
 */
export class MemorySyncEngine {
    private memoryStore: MemoryStore;
    private bridgeClient: MemoryBridgeClient | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private syncQueue: Set<string> = new Set(); // Track interaction IDs to sync
    private isSyncing: boolean = false;
    private debounceTimer: NodeJS.Timeout | null = null;
    private isOnline: boolean = true; // Track online/offline status (Task 12.1)
    
    // Configuration
    private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
    private readonly DEBOUNCE_DELAY_MS = 5000; // 5 seconds (Task 11.1)
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAYS_MS = [300000, 900000, 3600000]; // 5min, 15min, 1h (Task 11.2)
    
    // Sovereign identity keys (loaded from settings)
    private publicKeyHex: string | null = null;
    private privateKeyHex: string | null = null;
    
    constructor(memoryStore: MemoryStore) {
        this.memoryStore = memoryStore;
    }
    
    /**
     * Start background sync watcher
     */
    public start(): void {
        console.log('[SYNC ENGINE] Starting background sync...');
        
        // Load sovereign identity keys
        this.loadSovereignKeys();
        
        // Initialize bridge client
        const config = vscode.workspace.getConfiguration('angoIA');
        const serverUrl = config.get<string>('diotec360.endpoint') || 'https://diotec-360-diotec-360-ia-judge.hf.space';
        this.bridgeClient = new MemoryBridgeClient(serverUrl);
        
        // Setup online/offline detection (Task 12.1, 12.2)
        this.setupNetworkMonitoring();
        
        // Start periodic sync
        this.syncInterval = setInterval(() => {
            this.syncPendingInteractions();
        }, this.SYNC_INTERVAL_MS);
        
        // Initial sync
        this.syncPendingInteractions();
    }
    
    /**
     * Setup network monitoring for offline support (Task 12.1, 12.2)
     */
    private setupNetworkMonitoring(): void {
        // Check initial online status
        this.checkOnlineStatus();
        
        // Monitor network connectivity changes
        // Note: VS Code doesn't have a built-in network status API,
        // so we'll detect offline status through sync failures
        console.log('[SYNC ENGINE] Network monitoring enabled');
    }
    
    /**
     * Check if we're online by attempting a lightweight request (Task 12.1)
     */
    private async checkOnlineStatus(): Promise<boolean> {
        if (!this.bridgeClient) {
            return false;
        }
        
        try {
            // Try to fetch interactions (lightweight check)
            if (this.publicKeyHex) {
                await this.bridgeClient.getInteractions(this.publicKeyHex, 1, 1);
            }
            
            if (!this.isOnline) {
                // We're back online!
                this.isOnline = true;
                console.log('[SYNC ENGINE] ✅ Back online. Syncing interactions...');
                vscode.window.showInformationMessage('✅ Back online. Syncing interactions...');
                
                // Trigger sync of all pending interactions (Task 12.2)
                this.syncAllPendingInteractions();
            }
            
            return true;
        } catch (error) {
            if (!this.isOnline) {
                // Already offline, no need to notify again
                return false;
            }
            
            // We just went offline
            this.isOnline = false;
            console.log('[SYNC ENGINE] ⚠️ Offline mode. Interactions saved locally.');
            vscode.window.showWarningMessage('⚠️ Offline mode. Interactions saved locally.');
            
            return false;
        }
    }
    
    /**
     * Sync all pending interactions (Task 12.2)
     */
    private async syncAllPendingInteractions(): Promise<void> {
        const db = await this.memoryStore.getDatabase();
        
        const result = db.exec(
            `SELECT id FROM interactions WHERE synced = 0 OR sync_status = 'local_only'`
        );
        
        if (!result.length || !result[0].values.length) {
            return;
        }
        
        const { values } = result[0];
        
        for (const row of values) {
            const interactionId = row[0] as string;
            this.queueInteraction(interactionId);
        }
    }
    
    /**
     * Stop background sync watcher
     */
    public stop(): void {
        console.log('[SYNC ENGINE] Stopping background sync...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    /**
     * Load sovereign identity keys from settings
     */
    private loadSovereignKeys(): void {
        const config = vscode.workspace.getConfiguration('angoIA');
        
        this.publicKeyHex = config.get<string>('sovereignIdentity.publicKey') || null;
        this.privateKeyHex = config.get<string>('sovereignIdentity.privateKey') || null;
        
        if (!this.publicKeyHex || !this.privateKeyHex) {
            console.warn('[SYNC ENGINE] Sovereign identity not configured. Sync disabled.');
            console.warn('[SYNC ENGINE] Run "Ango IA: Configure Sovereign Identity" to enable sync.');
        }
    }

    
    /**
     * Sync pending interactions to Merkle Tree
     */
    private async syncPendingInteractions(): Promise<void> {
        if (this.isSyncing) {
            console.log('[SYNC ENGINE] Sync already in progress, skipping...');
            return;
        }
        
        if (!this.publicKeyHex || !this.privateKeyHex || !this.bridgeClient) {
            // Sovereign identity not configured or bridge client not initialized
            return;
        }
        
        this.isSyncing = true;
        
        try {
            // Get unsynced interactions from SQLite
            const unsyncedInteractions = await this.getUnsyncedInteractions();
            
            if (unsyncedInteractions.length === 0) {
                console.log('[SYNC ENGINE] No pending interactions to sync');
                return;
            }
            
            console.log(`[SYNC ENGINE] Syncing ${unsyncedInteractions.length} interactions...`);
            
            // Sync each interaction
            for (const interaction of unsyncedInteractions) {
                await this.syncInteraction(interaction);
            }
            
            console.log('[SYNC ENGINE] Sync complete');
        } catch (error) {
            console.error('[SYNC ENGINE] Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }
    
    /**
     * Get unsynced interactions from SQLite
     */
    private async getUnsyncedInteractions(): Promise<InteractionNode[]> {
        // Query SQLite for interactions where synced = 0
        const db = await this.memoryStore.getDatabase();
        
        const result = db.exec(
            `SELECT * FROM interactions WHERE synced = 0 ORDER BY timestamp ASC LIMIT 10`
        );
        
        if (!result.length) {
            return [];
        }
        
        const { columns, values } = result[0];
        
        const interactions: InteractionNode[] = values.map(row => {
            const obj: Record<string, any> = {};
            for (let i = 0; i < columns.length; i++) {
                obj[columns[i] ?? String(i)] = row[i];
            }
            
            return {
                interaction_id: obj.id,
                timestamp: obj.timestamp,
                critic_provider: obj.provider,
                critic_model: obj.model,
                command: obj.command,
                context_hash: obj.context_hash,
                response_size: obj.response_chars || 0,
                judge_verdict: obj.judge_verdict || 'unverified',
                judge_message: obj.judge_message || ''
            };
        });
        
        return interactions;
    }
    
    /**
     * Sync single interaction to Merkle Tree
     */
    private async syncInteraction(interaction: InteractionNode): Promise<void> {
        if (!this.bridgeClient) {
            throw new Error('Bridge client not initialized');
        }
        
        try {
            // Create sovereign auth envelope
            const auth = this.createSovereignAuth(interaction);
            
            // Send to server using bridge client
            const response = await this.bridgeClient.syncInteraction(interaction, auth);
            
            if (response.ok) {
                // Mark as synced in SQLite
                await this.markAsSynced(interaction.interaction_id, response.merkle_root);
                
                console.log(`[SYNC ENGINE] Synced interaction ${interaction.interaction_id}`);
                console.log(`[SYNC ENGINE] Merkle root: ${response.merkle_root.substring(0, 16)}...`);
            } else {
                console.error(`[SYNC ENGINE] Sync failed for interaction ${interaction.interaction_id}`);
            }
        } catch (error) {
            if (error instanceof NetworkError) {
                console.error(`[SYNC ENGINE] Network error syncing interaction ${interaction.interaction_id}:`, error.type, error.message);
            } else {
                console.error(`[SYNC ENGINE] Error syncing interaction ${interaction.interaction_id}:`, error);
            }
        }
    }
    
    /**
     * Create sovereign authentication envelope
     */
    private createSovereignAuth(interaction: InteractionNode): SovereignAuth {
        if (!this.publicKeyHex || !this.privateKeyHex) {
            throw new Error('Sovereign identity not configured');
        }
        
        // Generate nonce (UUID v4)
        const nonce = this.generateUUID();
        
        // Current timestamp in milliseconds
        const timestamp = Date.now();
        
        // Create message to sign (canonical JSON)
        const messageToSign = JSON.stringify({
            interaction: interaction,
            timestamp: timestamp,
            nonce: nonce,
            publicKeyHex: this.publicKeyHex
        }, Object.keys({
            interaction: null,
            timestamp: null,
            nonce: null,
            publicKeyHex: null
        }).sort());
        
        // Calculate SHA-256 hash of message
        const messageHash = crypto.createHash('sha256')
            .update(messageToSign)
            .digest('hex');
        
        // Sign message hash with ED25519 private key
        const signatureHex = this.signMessage(messageHash);
        
        return {
            publicKeyHex: this.publicKeyHex,
            signatureHex: signatureHex,
            timestamp: timestamp,
            nonce: nonce
        };
    }
    
    /**
     * Sign message with ED25519 private key
     */
    private signMessage(messageHash: string): string {
        if (!this.privateKeyHex) {
            throw new Error('Private key not configured');
        }
        
        // Convert hex private key to Buffer
        const privateKeyBuffer = Buffer.from(this.privateKeyHex, 'hex');
        
        // Convert message hash to Buffer
        const messageBuffer = Buffer.from(messageHash, 'hex');
        
        // Sign with ED25519
        const signature = crypto.sign(null, messageBuffer, {
            key: privateKeyBuffer,
            format: 'der',
            type: 'pkcs8'
        });
        
        return signature.toString('hex');
    }
    
    /**
     * Mark interaction as synced in SQLite (Task 16.3)
     * 
     * Also refreshes status bar to show updated sync state
     */
    private async markAsSynced(interactionId: string, merkleRoot: string): Promise<void> {
        const db = await this.memoryStore.getDatabase();
        
        db.run(
            `UPDATE interactions SET synced = 1, merkle_root = ? WHERE id = ?`,
            [merkleRoot, interactionId]
        );
        
        // Task 16.3: Refresh status bar after sync completes
        this.refreshStatusBar();
    }
    
    /**
     * Refresh status bar (Task 16.3)
     * 
     * Dynamically imports to avoid circular dependency
     */
    private refreshStatusBar(): void {
        try {
            // Dynamic import to avoid circular dependency
            import('../extension.js').then(ext => {
                const statusBar = ext.getStatusBar();
                if (statusBar) {
                    statusBar.refresh();
                }
            });
        } catch (error) {
            // Silently fail - status bar refresh is not critical
            console.log('[SYNC ENGINE] Could not refresh status bar:', error);
        }
    }
    
    /**
     * Generate UUID v4
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Queue interaction for sync (Task 11.1)
     * 
     * After interaction completes, wait 5 seconds before syncing.
     * If multiple interactions complete within 5 seconds, batch them.
     * 
     * @param interactionId - ID of interaction to queue for sync
     */
    public queueInteraction(interactionId: string): void {
        console.log(`[SYNC ENGINE] Queuing interaction ${interactionId} for sync`);
        
        // Add to queue
        this.syncQueue.add(interactionId);
        
        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Set new debounce timer (5 seconds)
        this.debounceTimer = setTimeout(() => {
            console.log(`[SYNC ENGINE] Debounce timer expired, syncing ${this.syncQueue.size} queued interactions`);
            this.syncQueuedInteractions();
        }, this.DEBOUNCE_DELAY_MS);
    }
    
    /**
     * Sync all queued interactions (Task 11.1)
     */
    private async syncQueuedInteractions(): Promise<void> {
        if (this.syncQueue.size === 0) {
            return;
        }
        
        // Copy queue and clear it
        const idsToSync = Array.from(this.syncQueue);
        this.syncQueue.clear();
        
        console.log(`[SYNC ENGINE] Syncing ${idsToSync.length} queued interactions`);
        
        // Sync each interaction
        for (const interactionId of idsToSync) {
            await this.syncInteractionById(interactionId);
        }
    }
    
    /**
     * Sync interaction by ID with retry logic (Task 11.2)
     * 
     * @param interactionId - ID of interaction to sync
     */
    private async syncInteractionById(interactionId: string): Promise<void> {
        if (!this.bridgeClient) {
            console.error('[SYNC ENGINE] Bridge client not initialized');
            return;
        }
        
        // Check if we're online before attempting sync (Task 12.1)
        if (!this.isOnline) {
            console.log(`[SYNC ENGINE] Offline - keeping interaction ${interactionId} as local_only`);
            return;
        }
        
        try {
            // Get interaction from SQLite
            const interaction = await this.getInteractionById(interactionId);
            
            if (!interaction) {
                console.error(`[SYNC ENGINE] Interaction ${interactionId} not found in database`);
                return;
            }
            
            // Get current sync attempts
            const syncAttempts = await this.getSyncAttempts(interactionId);
            
            // Check if max retries exceeded
            if (syncAttempts >= this.MAX_RETRY_ATTEMPTS) {
                console.error(`[SYNC ENGINE] Max retry attempts (${this.MAX_RETRY_ATTEMPTS}) exceeded for interaction ${interactionId}`);
                await this.markAsSyncFailed(interactionId);
                return;
            }
            
            // Update sync status to 'syncing'
            await this.updateSyncStatus(interactionId, 'syncing', syncAttempts + 1);
            
            // Create sovereign auth envelope
            const auth = this.createSovereignAuth(interaction);
            
            // Send to server using bridge client
            const response = await this.bridgeClient.syncInteraction(interaction, auth);
            
            if (response.ok) {
                // Mark as synced in SQLite
                await this.markAsSynced(interactionId, response.merkle_root);
                
                console.log(`[SYNC ENGINE] Synced interaction ${interactionId}`);
                console.log(`[SYNC ENGINE] Merkle root: ${response.merkle_root.substring(0, 16)}...`);
                
                // Update online status
                if (!this.isOnline) {
                    this.isOnline = true;
                    console.log('[SYNC ENGINE] ✅ Back online');
                    vscode.window.showInformationMessage('✅ Back online. Syncing interactions...');
                }
            } else {
                console.error(`[SYNC ENGINE] Sync failed for interaction ${interactionId}`);
                await this.scheduleRetry(interactionId, syncAttempts + 1);
            }
        } catch (error) {
            if (error instanceof NetworkError) {
                console.error(`[SYNC ENGINE] Network error syncing interaction ${interactionId}:`, error.type, error.message);
                
                // Check if this is a connection failure (offline)
                if (error.type === NetworkErrorType.CONNECTION_FAILED || error.type === NetworkErrorType.TIMEOUT) {
                    await this.checkOnlineStatus();
                }
                
                // Get current sync attempts
                const syncAttempts = await this.getSyncAttempts(interactionId);
                
                // Schedule retry with exponential backoff
                await this.scheduleRetry(interactionId, syncAttempts + 1);
            } else {
                console.error(`[SYNC ENGINE] Error syncing interaction ${interactionId}:`, error);
            }
        }
    }
    
    /**
     * Get interaction by ID from SQLite
     */
    private async getInteractionById(interactionId: string): Promise<InteractionNode | null> {
        const db = await this.memoryStore.getDatabase();
        
        const result = db.exec(
            `SELECT * FROM interactions WHERE id = ? LIMIT 1`,
            [interactionId]
        );
        
        if (!result.length || !result[0].values.length) {
            return null;
        }
        
        const { columns, values } = result[0];
        const row = values[0];
        
        const obj: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
            obj[columns[i] ?? String(i)] = row[i];
        }
        
        return {
            interaction_id: obj.id,
            timestamp: obj.timestamp,
            critic_provider: obj.provider,
            critic_model: obj.model,
            command: obj.command,
            context_hash: obj.context_hash,
            response_size: obj.response_chars || 0,
            judge_verdict: obj.judge_verdict || 'unverified',
            judge_message: obj.judge_message || ''
        };
    }
    
    /**
     * Get sync attempts count for interaction
     */
    private async getSyncAttempts(interactionId: string): Promise<number> {
        const db = await this.memoryStore.getDatabase();
        
        const result = db.exec(
            `SELECT sync_attempts FROM interactions WHERE id = ? LIMIT 1`,
            [interactionId]
        );
        
        if (!result.length || !result[0].values.length) {
            return 0;
        }
        
        return (result[0].values[0][0] as number) || 0;
    }
    
    /**
     * Update sync status and increment sync attempts (Task 11.2)
     */
    private async updateSyncStatus(
        interactionId: string,
        status: 'local_only' | 'syncing' | 'synced' | 'sync_failed',
        syncAttempts: number
    ): Promise<void> {
        const db = await this.memoryStore.getDatabase();
        
        db.run(
            `UPDATE interactions 
             SET sync_status = ?, sync_attempts = ?, last_sync_attempt = ? 
             WHERE id = ?`,
            [status, syncAttempts, Date.now(), interactionId]
        );
    }
    
    /**
     * Mark interaction as sync failed (Task 11.2)
     */
    private async markAsSyncFailed(interactionId: string): Promise<void> {
        const db = await this.memoryStore.getDatabase();
        
        db.run(
            `UPDATE interactions 
             SET sync_status = 'sync_failed', last_sync_attempt = ? 
             WHERE id = ?`,
            [Date.now(), interactionId]
        );
    }
    
    /**
     * Schedule retry with exponential backoff (Task 11.2)
     * 
     * Retry delays:
     * - Attempt 1: 5 minutes
     * - Attempt 2: 15 minutes
     * - Attempt 3: 1 hour
     * - After 3 attempts: mark as sync_failed
     */
    private async scheduleRetry(interactionId: string, attemptNumber: number): Promise<void> {
        if (attemptNumber > this.MAX_RETRY_ATTEMPTS) {
            console.log(`[SYNC ENGINE] Max retries exceeded for interaction ${interactionId}, marking as failed`);
            await this.markAsSyncFailed(interactionId);
            return;
        }
        
        const delayMs = this.RETRY_DELAYS_MS[attemptNumber - 1] || this.RETRY_DELAYS_MS[this.RETRY_DELAYS_MS.length - 1];
        
        console.log(`[SYNC ENGINE] Scheduling retry ${attemptNumber} for interaction ${interactionId} in ${delayMs / 1000}s`);
        
        // Update sync status to local_only (pending retry)
        await this.updateSyncStatus(interactionId, 'local_only', attemptNumber);
        
        // Schedule retry
        setTimeout(() => {
            console.log(`[SYNC ENGINE] Retry ${attemptNumber} for interaction ${interactionId}`);
            this.syncInteractionById(interactionId);
        }, delayMs);
    }
    
    /**
     * Manually trigger sync (for testing)
     */
    public async triggerSync(): Promise<void> {
        console.log('[SYNC ENGINE] Manual sync triggered');
        await this.syncPendingInteractions();
    }
}
