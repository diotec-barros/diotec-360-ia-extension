/**
 * Idle Detector - Monitors user activity to trigger mining during idle periods
 * Part of DIOTEC 360 Lattice Node Bridge v3.4.0
 */

import * as vscode from 'vscode';

export interface IdleState {
    lastActivityTimestamp: number;
    isIdle: boolean;
    idleThresholdMs: number;
    checkIntervalMs: number;
}

export type IdleStateChangeCallback = (isIdle: boolean) => void;

export class IdleDetector {
    private state: IdleState;
    private checkInterval: NodeJS.Timeout | null = null;
    private disposables: vscode.Disposable[] = [];
    private callbacks: IdleStateChangeCallback[] = [];

    constructor(idleThresholdSeconds: number = 30) {
        this.state = {
            lastActivityTimestamp: Date.now(),
            isIdle: false,
            idleThresholdMs: idleThresholdSeconds * 1000,
            checkIntervalMs: 5000 // Check every 5 seconds
        };
    }

    /**
     * Start monitoring user activity
     */
    public startMonitoring(): void {
        // Register activity listeners
        this.registerActivityListeners();

        // Start periodic idle check
        this.checkInterval = setInterval(() => {
            this.checkIdleStatus();
        }, this.state.checkIntervalMs);

        console.log('[IdleDetector] Monitoring started');
    }

    /**
     * Stop monitoring and cleanup
     */
    public stopMonitoring(): void {
        // Clear interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Dispose all listeners
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        console.log('[IdleDetector] Monitoring stopped');
    }

    /**
     * Subscribe to idle state changes
     */
    public onIdleStateChange(callback: IdleStateChangeCallback): vscode.Disposable {
        this.callbacks.push(callback);

        return new vscode.Disposable(() => {
            const index = this.callbacks.indexOf(callback);
            if (index >= 0) {
                this.callbacks.splice(index, 1);
            }
        });
    }

    /**
     * Get current idle state
     */
    public getState(): Readonly<IdleState> {
        return { ...this.state };
    }

    /**
     * Update idle threshold
     */
    public setIdleThreshold(seconds: number): void {
        this.state.idleThresholdMs = seconds * 1000;
        console.log(`[IdleDetector] Idle threshold updated to ${seconds}s`);
    }

    /**
     * Register all activity listeners
     */
    private registerActivityListeners(): void {
        // Text document changes (typing)
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(() => {
                this.onActivity();
            })
        );

        // Active editor changes (mouse clicks, focus)
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                this.onActivity();
            })
        );

        // Terminal activity
        this.disposables.push(
            vscode.window.onDidChangeActiveTerminal(() => {
                this.onActivity();
            })
        );

        // Command execution
        this.disposables.push(
            vscode.commands.registerCommand('_diotec360.internal.recordActivity', () => {
                this.onActivity();
            })
        );

        // Window focus changes
        this.disposables.push(
            vscode.window.onDidChangeWindowState((state) => {
                if (state.focused) {
                    this.onActivity();
                }
            })
        );
    }

    /**
     * Handle user activity event
     */
    private onActivity(): void {
        const now = Date.now();
        const wasIdle = this.state.isIdle;

        this.state.lastActivityTimestamp = now;

        // If we were idle, transition back to active
        if (wasIdle) {
            this.state.isIdle = false;
            this.notifyStateChange(false);
            console.log('[IdleDetector] User activity detected - exiting idle mode');
        }
    }

    /**
     * Periodic check for idle status
     */
    private checkIdleStatus(): void {
        const now = Date.now();
        const timeSinceLastActivity = now - this.state.lastActivityTimestamp;
        const shouldBeIdle = timeSinceLastActivity >= this.state.idleThresholdMs;

        // State transition: active -> idle
        if (!this.state.isIdle && shouldBeIdle) {
            this.state.isIdle = true;
            this.notifyStateChange(true);
            console.log(`[IdleDetector] Idle detected after ${Math.round(timeSinceLastActivity / 1000)}s`);
        }
    }

    /**
     * Notify all subscribers of state change
     */
    private notifyStateChange(isIdle: boolean): void {
        this.callbacks.forEach(callback => {
            try {
                callback(isIdle);
            } catch (error) {
                console.error('[IdleDetector] Error in state change callback:', error);
            }
        });
    }

    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        this.stopMonitoring();
        this.callbacks = [];
    }
}
