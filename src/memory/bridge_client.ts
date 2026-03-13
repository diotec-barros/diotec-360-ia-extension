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
 * Memory Bridge Client - Unified Merkle Memory v3.3.0
 * 
 * HTTP client for DIOTEC 360 Memory Bridge API.
 * 
 * Features:
 * - POST /api/memory/sync - Sync interaction to Merkle Tree
 * - GET /api/memory/interactions - Retrieve interaction history
 * - 10-second timeout on all requests
 * - Response schema validation
 * - Network error handling
 * 
 * Task 10.1: Create MemoryBridgeClient class
 */

/**
 * Interaction data structure matching backend schema
 */
export interface InteractionNode {
    interaction_id: string;
    timestamp: number;
    critic_provider: string;
    critic_model: string;
    command: string;
    context_hash: string;
    response_size: number;
    judge_verdict: string;
    judge_message: string;
}

/**
 * Sovereign authentication envelope
 */
export interface SovereignAuth {
    publicKeyHex: string;
    signatureHex: string;
    timestamp: number;
    nonce: string;
}

/**
 * Sync request payload
 */
export interface SyncRequest {
    interaction: InteractionNode;
    auth: SovereignAuth;
}

/**
 * Sync response from server
 */
export interface SyncResponse {
    ok: boolean;
    merkle_root: string;
    account_hash: string;
    nonce: number;
}

/**
 * Get interactions response from server
 */
export interface GetInteractionsResponse {
    ok: boolean;
    interactions: Array<{
        interaction_id: string;
        timestamp: number;
        critic_provider: string;
        critic_model: string;
        command: string;
        context_hash: string;
        response_size: number;
        judge_verdict: string;
        judge_message: string;
        merkle_proof: {
            account_hash: string;
            root_hash: string;
        };
    }>;
    merkle_root: string;
    total_count: number;
}

/**
 * Network error types
 */
export enum NetworkErrorType {
    TIMEOUT = 'TIMEOUT',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    HTTP_ERROR = 'HTTP_ERROR',
    PARSE_ERROR = 'PARSE_ERROR',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Network error with type classification
 */
export class NetworkError extends Error {
    constructor(
        public type: NetworkErrorType,
        message: string,
        public statusCode?: number,
        public responseBody?: string
    ) {
        super(message);
        this.name = 'NetworkError';
    }
}

/**
 * Memory Bridge HTTP Client
 * 
 * Handles communication with DIOTEC 360 backend API.
 * 
 * Requirements:
 * - AC-4: Backend API Endpoints
 * - NFR-1: Performance (10-second timeout)
 */
export class MemoryBridgeClient {
    private readonly backendUrl: string;
    private readonly timeoutMs: number = 10000; // 10 seconds
    private readonly maxRetries: number = 3;
    private readonly retryDelayMs: number = 1000; // 1 second base delay
    
    /**
     * Create a new Memory Bridge client
     * 
     * @param backendUrl - Base URL of DIOTEC 360 backend (e.g., "https://diotec360.hf.space")
     */
    constructor(backendUrl: string) {
        this.backendUrl = backendUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    /**
     * Sync interaction to Merkle Tree with automatic retry on 5xx errors
     * 
     * POST /api/memory/sync
     * 
     * @param payload - Interaction data
     * @param auth - Sovereign authentication envelope
     * @returns Sync response with Merkle root and account hash
     * @throws NetworkError on timeout, connection failure, or HTTP error
     */
    async syncInteraction(
        payload: InteractionNode,
        auth: SovereignAuth
    ): Promise<SyncResponse> {
        return this.retryOn5xx(() => this.syncInteractionOnce(payload, auth));
    }
    
    /**
     * Sync interaction to Merkle Tree (single attempt)
     */
    private async syncInteractionOnce(
        payload: InteractionNode,
        auth: SovereignAuth
    ): Promise<SyncResponse> {
        const url = `${this.backendUrl}/api/memory/sync`;
        
        const request: SyncRequest = {
            interaction: payload,
            auth: auth
        };
        
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
            
            // Make HTTP request
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorBody = await response.text();
                throw new NetworkError(
                    NetworkErrorType.HTTP_ERROR,
                    `HTTP ${response.status}: ${errorBody}`,
                    response.status,
                    errorBody
                );
            }
            
            // Parse and validate response
            const data = await response.json();
            this.validateSyncResponse(data);
            
            return data as SyncResponse;
            
        } catch (error: any) {
            // Handle timeout
            if (error.name === 'AbortError') {
                throw new NetworkError(
                    NetworkErrorType.TIMEOUT,
                    `Request timed out after ${this.timeoutMs}ms`
                );
            }
            
            // Handle connection errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new NetworkError(
                    NetworkErrorType.CONNECTION_FAILED,
                    'Failed to connect to backend (network offline or server unreachable)'
                );
            }
            
            // Re-throw NetworkError
            if (error instanceof NetworkError) {
                throw error;
            }
            
            // Handle JSON parse errors
            if (error instanceof SyntaxError) {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    `Failed to parse response: ${error.message}`
                );
            }
            
            // Unknown error
            throw new NetworkError(
                NetworkErrorType.UNKNOWN,
                `Unexpected error: ${error.message}`
            );
        }
    }
    
    /**
     * Get interaction history for a public key with automatic retry on 5xx errors
     * 
     * GET /api/memory/interactions
     * 
     * @param publicKey - ED25519 public key (hex format)
     * @param page - Page number (default: 1)
     * @param limit - Items per page (default: 100, max: 100)
     * @returns Interaction history with Merkle proofs
     * @throws NetworkError on timeout, connection failure, or HTTP error
     */
    async getInteractions(
        publicKey: string,
        page: number = 1,
        limit: number = 100
    ): Promise<GetInteractionsResponse> {
        return this.retryOn5xx(() => this.getInteractionsOnce(publicKey, page, limit));
    }
    
    /**
     * Get interaction history (single attempt)
     */
    private async getInteractionsOnce(
        publicKey: string,
        page: number,
        limit: number
    ): Promise<GetInteractionsResponse> {
        // Validate parameters
        if (page < 1) {
            throw new Error('Page must be >= 1');
        }
        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
        
        const url = `${this.backendUrl}/api/memory/interactions?publicKey=${encodeURIComponent(publicKey)}&page=${page}&limit=${limit}`;
        
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
            
            // Make HTTP request
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorBody = await response.text();
                throw new NetworkError(
                    NetworkErrorType.HTTP_ERROR,
                    `HTTP ${response.status}: ${errorBody}`,
                    response.status,
                    errorBody
                );
            }
            
            // Parse and validate response
            const data = await response.json();
            this.validateGetInteractionsResponse(data);
            
            return data as GetInteractionsResponse;
            
        } catch (error: any) {
            // Handle timeout
            if (error.name === 'AbortError') {
                throw new NetworkError(
                    NetworkErrorType.TIMEOUT,
                    `Request timed out after ${this.timeoutMs}ms`
                );
            }
            
            // Handle connection errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new NetworkError(
                    NetworkErrorType.CONNECTION_FAILED,
                    'Failed to connect to backend (network offline or server unreachable)'
                );
            }
            
            // Re-throw NetworkError
            if (error instanceof NetworkError) {
                throw error;
            }
            
            // Handle JSON parse errors
            if (error instanceof SyntaxError) {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    `Failed to parse response: ${error.message}`
                );
            }
            
            // Unknown error
            throw new NetworkError(
                NetworkErrorType.UNKNOWN,
                `Unexpected error: ${error.message}`
            );
        }
    }
    
    /**
     * Validate sync response schema
     */
    private validateSyncResponse(data: any): void {
        if (typeof data !== 'object' || data === null) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response is not a valid object'
            );
        }
        
        if (typeof data.ok !== 'boolean') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: ok (boolean)'
            );
        }
        
        if (typeof data.merkle_root !== 'string') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: merkle_root (string)'
            );
        }
        
        if (typeof data.account_hash !== 'string') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: account_hash (string)'
            );
        }
        
        if (typeof data.nonce !== 'number') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: nonce (number)'
            );
        }
        
        // Validate hash formats (64 hex characters for SHA-256)
        const hashRegex = /^[a-fA-F0-9]{64}$/;
        if (!hashRegex.test(data.merkle_root)) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Invalid merkle_root format (expected 64 hex characters)'
            );
        }
        
        if (!hashRegex.test(data.account_hash)) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Invalid account_hash format (expected 64 hex characters)'
            );
        }
    }
    
    /**
     * Validate get interactions response schema
     */
    private validateGetInteractionsResponse(data: any): void {
        if (typeof data !== 'object' || data === null) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response is not a valid object'
            );
        }
        
        if (typeof data.ok !== 'boolean') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: ok (boolean)'
            );
        }
        
        if (!Array.isArray(data.interactions)) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: interactions (array)'
            );
        }
        
        if (typeof data.merkle_root !== 'string') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: merkle_root (string)'
            );
        }
        
        if (typeof data.total_count !== 'number') {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Response missing required field: total_count (number)'
            );
        }
        
        // Validate merkle_root format (64 hex characters or 'empty')
        const hashRegex = /^[a-fA-F0-9]{64}$/;
        if (data.merkle_root !== 'empty' && !hashRegex.test(data.merkle_root)) {
            throw new NetworkError(
                NetworkErrorType.PARSE_ERROR,
                'Invalid merkle_root format (expected 64 hex characters or "empty")'
            );
        }
        
        // Validate each interaction has required fields
        for (const interaction of data.interactions) {
            if (typeof interaction.interaction_id !== 'string') {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    'Interaction missing required field: interaction_id'
                );
            }
            
            if (typeof interaction.merkle_proof !== 'object' || interaction.merkle_proof === null) {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    'Interaction missing required field: merkle_proof'
                );
            }
            
            if (typeof interaction.merkle_proof.account_hash !== 'string') {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    'Interaction merkle_proof missing required field: account_hash'
                );
            }
            
            if (typeof interaction.merkle_proof.root_hash !== 'string') {
                throw new NetworkError(
                    NetworkErrorType.PARSE_ERROR,
                    'Interaction merkle_proof missing required field: root_hash'
                );
            }
        }
    }
    
    /**
     * Retry function on 5xx errors with exponential backoff
     * Task 10.2: Implement network error handling with retry
     * 
     * @param fn - Function to retry
     * @returns Result of function
     * @throws NetworkError if all retries fail
     */
    private async retryOn5xx<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: NetworkError | null = null;
        
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (error instanceof NetworkError) {
                    // Only retry on 5xx errors (server errors)
                    if (error.type === NetworkErrorType.HTTP_ERROR && 
                        error.statusCode && 
                        error.statusCode >= 500 && 
                        error.statusCode < 600) {
                        
                        lastError = error;
                        
                        // Don't retry on last attempt
                        if (attempt < this.maxRetries - 1) {
                            // Exponential backoff: 1s, 2s, 4s
                            const delayMs = this.retryDelayMs * Math.pow(2, attempt);
                            console.log(`[BRIDGE CLIENT] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delayMs}ms`);
                            await this.sleep(delayMs);
                            continue;
                        }
                    }
                    
                    // Don't retry on 4xx errors (client errors) or other error types
                    throw error;
                }
                
                // Unknown error type, don't retry
                throw error;
            }
        }
        
        // All retries failed
        throw lastError || new NetworkError(
            NetworkErrorType.UNKNOWN,
            'All retry attempts failed'
        );
    }
    
    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
