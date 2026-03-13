/**
 * DIOTEC 360 IA - Sovereign SDK
 * JavaScript/TypeScript Client Library
 * 
 * "DIOTEC Inside" - Integrity as a Service
 * 
 * @version 1.0.0
 * @author DIOTEC 360 IA Engineering Team
 * @license MIT
 */

export interface DiotecConfig {
  /** API key for authentication */
  apiKey: string;
  
  /** Environment: 'sandbox' for testing, 'production' for live */
  environment: 'sandbox' | 'production';
  
  /** Custom base URL (optional, defaults based on environment) */
  baseUrl?: string;
  
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  
  /** Enable debug logging */
  debug?: boolean;
}

export interface VerifyRequest {
  /** Intent template name (e.g., 'transfer', 'escrow', 'vote') */
  intent: string;
  
  /** Parameters for the intent */
  params: Record<string, any>;
  
  /** Optional metadata for tracking */
  metadata?: Record<string, any>;
}

export interface VerifyResponse {
  /** Whether the verification succeeded */
  verified: boolean;
  
  /** Verification status: PROVED, FAILED, or ERROR */
  status: 'PROVED' | 'FAILED' | 'ERROR';
  
  /** Merkle proof hash for audit trail */
  merkleProof: string;
  
  /** URL to download full certificate */
  certificateUrl: string;
  
  /** ISO timestamp of verification */
  timestamp: string;
  
  /** Additional details about the verification */
  details?: any;
  
  /** Error message if status is ERROR */
  error?: string;
}

export interface MerkleProof {
  /** Proof ID */
  proofId: string;
  
  /** Merkle root hash */
  merkleRoot: string;
  
  /** Merkle path for verification */
  merklePath: string[];
  
  /** Whether the proof is valid */
  verified: boolean;
  
  /** Timestamp of proof generation */
  timestamp: string;
}

export interface Certificate {
  /** Certificate ID */
  certificateId: string;
  
  /** When the certificate was issued */
  issuedAt: string;
  
  /** Who verified it */
  verifiedBy: string;
  
  /** Certificate status */
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  
  /** Intent that was verified */
  intent: string;
  
  /** Parameters used */
  params: Record<string, any>;
  
  /** Verification result */
  result: string;
}

/**
 * DIOTEC 360 IA SDK Client
 * 
 * @example
 * ```typescript
 * import { DiotecSDK } from '@diotec360/sdk';
 * 
 * const diotec = new DiotecSDK({
 *   apiKey: 'your-api-key',
 *   environment: 'production'
 * });
 * 
 * const result = await diotec.verify({
 *   intent: 'transfer',
 *   params: {
 *     from: 'account_123',
 *     to: 'account_456',
 *     amount: 1000,
 *     currency: 'AOA'
 *   }
 * });
 * 
 * if (result.verified) {
 *   console.log('Transfer verified!', result.merkleProof);
 * }
 * ```
 */
export class DiotecSDK {
  private config: DiotecConfig;
  private baseUrl: string;

  constructor(config: DiotecConfig) {
    this.config = {
      timeout: 10000,
      debug: false,
      ...config
    };

    // Set base URL based on environment
    this.baseUrl = config.baseUrl || 
      (config.environment === 'production' 
        ? 'https://diotec-360-diotec-360-ia-judge.hf.space'
        : 'https://sandbox.diotec360.com');

    if (this.config.debug) {
      console.log('[DIOTEC SDK] Initialized', {
        environment: this.config.environment,
        baseUrl: this.baseUrl
      });
    }
  }

  /**
   * Verify a single intent with mathematical proof
   * 
   * @param request - The verification request
   * @returns Promise resolving to verification response
   * 
   * @example
   * ```typescript
   * const result = await diotec.verify({
   *   intent: 'transfer',
   *   params: { from: 'A', to: 'B', amount: 100 }
   * });
   * ```
   */
  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const startTime = Date.now();

    try {
      if (this.config.debug) {
        console.log('[DIOTEC SDK] Verifying intent:', request.intent);
      }

      const response = await this.fetch(`${this.baseUrl}/api/sdk/verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Verification failed: ${error.message || response.statusText}`);
      }

      const result: VerifyResponse = await response.json();

      if (this.config.debug) {
        console.log('[DIOTEC SDK] Verification complete:', {
          status: result.status,
          duration: Date.now() - startTime
        });
      }

      return result;

    } catch (error) {
      if (this.config.debug) {
        console.error('[DIOTEC SDK] Verification error:', error);
      }

      return {
        verified: false,
        status: 'ERROR',
        merkleProof: '',
        certificateUrl: '',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verify multiple intents in a single batch request
   * 
   * @param requests - Array of verification requests
   * @returns Promise resolving to array of verification responses
   * 
   * @example
   * ```typescript
   * const results = await diotec.batchVerify([
   *   { intent: 'transfer', params: { ... } },
   *   { intent: 'escrow', params: { ... } }
   * ]);
   * ```
   */
  async batchVerify(requests: VerifyRequest[]): Promise<VerifyResponse[]> {
    try {
      if (this.config.debug) {
        console.log('[DIOTEC SDK] Batch verifying', requests.length, 'intents');
      }

      const response = await this.fetch(`${this.baseUrl}/api/sdk/batch-verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ requests })
      });

      if (!response.ok) {
        throw new Error(`Batch verification failed: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if (this.config.debug) {
        console.error('[DIOTEC SDK] Batch verification error:', error);
      }

      // Return error response for each request
      return requests.map(() => ({
        verified: false,
        status: 'ERROR' as const,
        merkleProof: '',
        certificateUrl: '',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  /**
   * Retrieve a Merkle proof by ID
   * 
   * @param proofId - The proof ID from a verification response
   * @returns Promise resolving to Merkle proof details
   */
  async getProof(proofId: string): Promise<MerkleProof> {
    try {
      const response = await this.fetch(`${this.baseUrl}/api/sdk/proof/${proofId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get proof: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Failed to retrieve proof: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve a verification certificate by ID
   * 
   * @param certId - The certificate ID from a verification response
   * @returns Promise resolving to certificate details
   */
  async getCertificate(certId: string): Promise<Certificate> {
    try {
      const response = await this.fetch(`${this.baseUrl}/api/sdk/certificate/${certId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get certificate: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Failed to retrieve certificate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get current configuration (without API key)
   */
  getConfig(): Omit<DiotecConfig, 'apiKey'> {
    const { apiKey, ...config } = this.config;
    return config;
  }

  // Private helper methods

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-SDK-Version': this.getVersion(),
      'X-SDK-Platform': typeof window !== 'undefined' ? 'browser' : 'node'
    };
  }

  private async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Convenience functions for common intents
 * 
 * @example
 * ```typescript
 * import { Intents } from '@diotec360/sdk';
 * 
 * const transferIntent = Intents.transfer('account_A', 'account_B', 1000);
 * const result = await diotec.verify(transferIntent);
 * ```
 */
export const Intents = {
  /**
   * Create a money transfer intent
   */
  transfer: (from: string, to: string, amount: number, currency: string = 'AOA'): VerifyRequest => ({
    intent: 'transfer',
    params: { from, to, amount, currency }
  }),

  /**
   * Create an escrow intent
   */
  escrow: (buyer: string, seller: string, amount: number, conditions: string[]): VerifyRequest => ({
    intent: 'escrow',
    params: { buyer, seller, amount, conditions }
  }),

  /**
   * Create a voting intent
   */
  vote: (voterId: string, candidateId: string, electionId: string): VerifyRequest => ({
    intent: 'vote',
    params: { voterId, candidateId, electionId }
  }),

  /**
   * Create a delivery verification intent
   */
  delivery: (driverId: string, orderId: string, gpsLat: number, gpsLon: number): VerifyRequest => ({
    intent: 'delivery',
    params: { driverId, orderId, gpsLat, gpsLon }
  }),

  /**
   * Create a multi-signature intent
   */
  multisig: (signers: string[], threshold: number, signatures: string[]): VerifyRequest => ({
    intent: 'multisig',
    params: { signers, threshold, signatures }
  })
};

// Export everything
export default DiotecSDK;
