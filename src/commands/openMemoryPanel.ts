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
 * Open Memory Panel Command - Task 14
 * 
 * Shows sync status panel with all interactions and their sync state.
 */

import * as vscode from 'vscode';
import { MemoryStore } from '../memory/store';

/**
 * Open sync status panel (Task 14.2)
 */
export async function openMemoryPanel(
    context: vscode.ExtensionContext,
    memoryStore: MemoryStore
): Promise<void> {
    try {
        const db = await memoryStore.getDatabase();
        
        // Get all interactions with sync status
        const result = db.exec(
            `SELECT id, timestamp, command, provider, model, 
                    sync_status, synced, merkle_root, sync_attempts, last_sync_attempt
             FROM interactions 
             ORDER BY timestamp DESC 
             LIMIT 100`
        );
        
        if (!result.length || !result[0].values.length) {
            vscode.window.showInformationMessage('No interactions found');
            return;
        }
        
        const { columns, values } = result[0];
        
        // Build HTML content
        let html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        th {
            background-color: var(--vscode-editor-background);
            font-weight: bold;
        }
        .status-synced { color: #4caf50; }
        .status-syncing { color: #ff9800; }
        .status-local_only { color: #2196f3; }
        .status-sync_failed { color: #f44336; }
        .merkle-root {
            font-family: monospace;
            font-size: 0.9em;
        }
        .summary {
            margin-bottom: 20px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>🔄 Memory Sync Status</h1>
`;
        
        // Calculate summary statistics
        let syncedCount = 0;
        let pendingCount = 0;
        let failedCount = 0;
        
        const interactions: any[] = [];
        
        for (const row of values) {
            const obj: Record<string, any> = {};
            for (let i = 0; i < columns.length; i++) {
                obj[columns[i] ?? String(i)] = row[i];
            }
            
            interactions.push(obj);
            
            const status = obj.sync_status || (obj.synced ? 'synced' : 'local_only');
            
            if (status === 'synced') {
                syncedCount++;
            } else if (status === 'sync_failed') {
                failedCount++;
            } else {
                pendingCount++;
            }
        }
        
        // Add summary
        html += `
    <div class="summary">
        <strong>Summary:</strong><br>
        ✅ Synced: ${syncedCount}<br>
        ⏳ Pending: ${pendingCount}<br>
        ❌ Failed: ${failedCount}
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Command</th>
                <th>Provider/Model</th>
                <th>Status</th>
                <th>Merkle Root</th>
                <th>Attempts</th>
            </tr>
        </thead>
        <tbody>
`;
        
        // Add interactions
        for (const interaction of interactions) {
            const timestamp = new Date(interaction.timestamp).toLocaleString();
            const command = interaction.command;
            const provider = `${interaction.provider}/${interaction.model}`;
            const status = interaction.sync_status || (interaction.synced ? 'synced' : 'local_only');
            const merkleRoot = interaction.merkle_root 
                ? interaction.merkle_root.substring(0, 16) + '...' 
                : '-';
            const attempts = interaction.sync_attempts || 0;
            
            const statusIcon: Record<string, string> = {
                'synced': '✅',
                'syncing': '⏳',
                'local_only': '⚠️',
                'sync_failed': '❌'
            };
            
            const icon = statusIcon[status] || '?';
            
            html += `
            <tr>
                <td>${timestamp}</td>
                <td>${command}</td>
                <td>${provider}</td>
                <td class="status-${status}">${icon} ${status}</td>
                <td class="merkle-root">${merkleRoot}</td>
                <td>${attempts}</td>
            </tr>
`;
        }
        
        html += `
        </tbody>
    </table>
</body>
</html>
`;
        
        // Create and show webview panel
        const panel = vscode.window.createWebviewPanel(
            'angoMemoryPanel',
            'Memory Sync Status',
            vscode.ViewColumn.One,
            {
                enableScripts: false
            }
        );
        
        panel.webview.html = html;
        
    } catch (error: any) {
        console.error('[MEMORY PANEL] Error:', error);
        vscode.window.showErrorMessage(`Failed to open memory panel: ${error.message}`);
    }
}
