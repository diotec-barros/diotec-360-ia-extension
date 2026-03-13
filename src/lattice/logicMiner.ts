/**
 * Logic Miner - Requests Z3 challenges and solves them using Judge WASM
 * Part of DIOTEC 360 Lattice Node Bridge v3.4.0
 */

import * as vscode from 'vscode';
import { JudgeWasm, SolverResult } from './judgeWasm';
import { Output } from '../utils/logger.js';

export interface Challenge {
    challenge_id: string;
    z3_formula: string;
    difficulty: number;
    reward_credits: number;
    expires_at: number;
}

export interface MiningState {
    isActive: boolean;
    currentChallenge: Challenge | null;
    totalProofsSolved: number;
    totalCreditsEarned: number;
    lastMiningTimestamp: number;
    consecutiveFailures: number;
}

export interface ProofSubmission {
    challenge_id: string;
    proof: string;
    solver_time_ms: number;
    auth: {
        publicKeyHex: string;
        signatureHex: string;
        timestamp: number;
        nonce: string;
    };
}

export interface ProofResult {
    verified: boolean;
    credits_earned: number;
    total_credits: number;
    merkle_root: string;
}

export type MiningEventCallback = (event: MiningEvent) => void;

export interface MiningEvent {
    type: 'started' | 'stopped' | 'proof_solved' | 'credits_earned' | 'error';
    data?: any;
}

export class LogicMiner {
    private state: MiningState;
    private judgeWasm: JudgeWasm | null = null;
    private miningLoop: NodeJS.Timeout | null = null;
    private callbacks: MiningEventCallback[] = [];
    private output: Output;

    constructor(output: Output) {
        this.output = output;
        this.state = {
            isActive: false,
            currentChallenge: null,
            totalProofsSolved: 0,
            totalCreditsEarned: 0,
            lastMiningTimestamp: 0,
            consecutiveFailures: 0
        };
    }

    /**
     * Initialize Judge WASM engine
     */
    public async initialize(): Promise<void> {
        try {
            this.judgeWasm = new JudgeWasm();
            await this.judgeWasm.initialize();
            this.output.info('[LogicMiner] Judge WASM initialized successfully');
        } catch (error) {
            this.output.error(`[LogicMiner] Failed to initialize Judge WASM: ${error}`);
            throw error;
        }
    }

    /**
     * Start mining loop
     */
    public async startMining(): Promise<void> {
        if (this.state.isActive) {
            this.output.info('[LogicMiner] Mining already active');
            return;
        }

        if (!this.judgeWasm) {
            await this.initialize();
        }

        this.state.isActive = true;
        this.notifyEvent({ type: 'started' });
        this.output.info('[LogicMiner] Mining started');

        // Start mining loop
        this.runMiningLoop();
    }

    /**
     * Stop mining gracefully
     */
    public stopMining(): void {
        if (!this.state.isActive) {
            return;
        }

        this.state.isActive = false;
        this.state.currentChallenge = null;

        if (this.miningLoop) {
            clearTimeout(this.miningLoop);
            this.miningLoop = null;
        }

        this.notifyEvent({ type: 'stopped' });
        this.output.info('[LogicMiner] Mining stopped');
    }

    /**
     * Get current mining state
     */
    public getState(): Readonly<MiningState> {
        return { ...this.state };
    }

    /**
     * Subscribe to mining events
     */
    public onMiningEvent(callback: MiningEventCallback): vscode.Disposable {
        this.callbacks.push(callback);

        return new vscode.Disposable(() => {
            const index = this.callbacks.indexOf(callback);
            if (index >= 0) {
                this.callbacks.splice(index, 1);
            }
        });
    }

    /**
     * Main mining loop
     */
    private async runMiningLoop(): Promise<void> {
        if (!this.state.isActive) {
            return;
        }

        try {
            // Step 1: Request challenge from backend
            const challenge = await this.requestChallenge();
            if (!challenge) {
                // No challenges available, wait and retry
                this.scheduleMiningLoop(10000); // 10 seconds
                return;
            }

            this.state.currentChallenge = challenge;
            this.output.info(`[LogicMiner] Received challenge ${challenge.challenge_id} (difficulty: ${challenge.difficulty}, reward: ${challenge.reward_credits})`);

            // Step 2: Solve challenge using Judge WASM
            const solverResult = await this.solveChallenge(challenge);
            if (!solverResult.success || !solverResult.proof) {
                this.output.info(`[LogicMiner] Failed to solve challenge: ${solverResult.error || 'unknown error'}`);
                this.handleMiningError(new Error(solverResult.error || 'Solver failed'));
                this.scheduleMiningLoop(5000); // 5 seconds
                return;
            }

            this.output.info(`[LogicMiner] Challenge solved in ${solverResult.solverTimeMs}ms`);
            this.notifyEvent({ type: 'proof_solved', data: { challenge_id: challenge.challenge_id } });

            // Step 3: Submit proof to backend
            const proofResult = await this.submitProof(challenge, solverResult);
            if (proofResult && proofResult.verified) {
                this.state.totalProofsSolved++;
                this.state.totalCreditsEarned += proofResult.credits_earned;
                this.state.lastMiningTimestamp = Date.now();
                this.state.consecutiveFailures = 0;

                this.output.info(`[LogicMiner] Proof verified! Earned ${proofResult.credits_earned} credits (total: ${proofResult.total_credits})`);
                this.notifyEvent({
                    type: 'credits_earned',
                    data: {
                        credits: proofResult.credits_earned,
                        total: proofResult.total_credits,
                        merkle_root: proofResult.merkle_root
                    }
                });
            } else {
                this.output.info('[LogicMiner] Proof rejected by backend');
                this.handleMiningError(new Error('Proof rejected'));
            }

            // Continue mining if still active
            this.scheduleMiningLoop(1000); // 1 second

        } catch (error) {
            this.output.info(`[LogicMiner] Mining loop error: ${error}`);
            this.handleMiningError(error as Error);
            this.scheduleMiningLoop(30000); // 30 seconds on error
        }
    }

    /**
     * Schedule next mining loop iteration
     */
    private scheduleMiningLoop(delayMs: number): void {
        if (!this.state.isActive) {
            return;
        }

        this.miningLoop = setTimeout(() => {
            this.runMiningLoop();
        }, delayMs);
    }

    /**
     * Request challenge from backend
     */
    private async requestChallenge(): Promise<Challenge | null> {
        try {
            const serverUrl = vscode.workspace.getConfiguration('angoIA').get<string>('diotec360.endpoint', 'https://diotec-360-diotec-360-ia-judge.hf.space');

            const response = await fetch(`${serverUrl}/api/lattice/challenge`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // No challenges available
                    return null;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.ok) {
                return null;
            }

            return {
                challenge_id: data.challenge_id,
                z3_formula: data.z3_formula,
                difficulty: data.difficulty,
                reward_credits: data.reward_credits,
                expires_at: data.expires_at
            };

        } catch (error) {
            this.output.info(`[LogicMiner] Failed to request challenge: ${error}`);
            return null;
        }
    }

    /**
     * Solve challenge using Judge WASM
     */
    private async solveChallenge(challenge: Challenge): Promise<SolverResult> {
        if (!this.judgeWasm) {
            return {
                success: false,
                proof: null,
                solverTimeMs: 0,
                error: 'Judge WASM not initialized'
            };
        }

        try {
            // Solve with 60-second timeout
            const result = await this.judgeWasm.solve(challenge.z3_formula, 60000);
            return result;
        } catch (error) {
            return {
                success: false,
                proof: null,
                solverTimeMs: 0,
                error: String(error)
            };
        }
    }

    /**
     * Submit proof to backend
     */
    private async submitProof(challenge: Challenge, solverResult: SolverResult): Promise<ProofResult | null> {
        try {
            const serverUrl = vscode.workspace.getConfiguration('angoIA').get<string>('diotec360.endpoint', 'https://diotec-360-diotec-360-ia-judge.hf.space');
            const publicKey = vscode.workspace.getConfiguration('angoIA').get<string>('diotec360.publicKeyHex', '');
            const privateKey = '';

            if (!publicKey || !privateKey) {
                throw new Error('Sovereign identity not configured');
            }

            // TODO: Generate ED25519 signature
            // For now, using placeholder
            const timestamp = Math.floor(Date.now() / 1000);
            const nonce = this.generateNonce();

            const submission: ProofSubmission = {
                challenge_id: challenge.challenge_id,
                proof: solverResult.proof!,
                solver_time_ms: solverResult.solverTimeMs,
                auth: {
                    publicKeyHex: publicKey,
                    signatureHex: 'TODO_SIGNATURE', // TODO: Implement signing
                    timestamp,
                    nonce
                }
            };

            const response = await fetch(`${serverUrl}/api/lattice/submit-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submission)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.ok) {
                return null;
            }

            return {
                verified: data.verified,
                credits_earned: data.credits_earned,
                total_credits: data.total_credits,
                merkle_root: data.merkle_root
            };

        } catch (error) {
            this.output.info(`[LogicMiner] Failed to submit proof: ${error}`);
            return null;
        }
    }

    /**
     * Handle mining error with exponential backoff
     */
    private handleMiningError(error: Error): void {
        this.state.consecutiveFailures++;

        this.notifyEvent({
            type: 'error',
            data: {
                error: error.message,
                consecutiveFailures: this.state.consecutiveFailures
            }
        });

        // Stop mining after 3 consecutive failures
        if (this.state.consecutiveFailures >= 3) {
            this.output.info('[LogicMiner] Too many consecutive failures, stopping mining');
            this.stopMining();
        }
    }

    /**
     * Generate unique nonce
     */
    private generateNonce(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Notify all subscribers of mining event
     */
    private notifyEvent(event: MiningEvent): void {
        this.callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('[LogicMiner] Error in event callback:', error);
            }
        });
    }

    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        this.stopMining();

        if (this.judgeWasm) {
            this.judgeWasm.dispose();
            this.judgeWasm = null;
        }

        this.callbacks = [];
    }
}
