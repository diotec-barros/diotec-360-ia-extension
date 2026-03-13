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
 * Merkle Proof Generation and Verification - Unified Merkle Memory v3.3.0
 * 
 * Task 17: Merkle Proof Generation
 * Task 18: Merkle Proof Verification
 * 
 * Provides cryptographic proof that an interaction exists in the Merkle Tree.
 */

import * as crypto from 'crypto';

/**
 * Merkle proof structure
 */
export interface MerkleProof {
    account_hash: string;
    root_hash: string;
    interaction_hash: string;
    path: Array<{
        hash: string;
        position: 'left' | 'right';
    }>;
}

/**
 * Merkle Proof Generator
 * 
 * Generates cryptographic proofs for interactions in the Merkle Tree.
 */
export class MerkleProofGenerator {
    /**
     * Generate Merkle proof for an interaction (Task 17.1)
     * 
     * @param interactionHash - Hash of the interaction
     * @param accountHash - Hash of the account
     * @param rootHash - Current Merkle root hash
     * @param siblingHashes - Sibling hashes along the path to root
     * @returns Merkle proof
     */
    static generateProof(
        interactionHash: string,
        accountHash: string,
        rootHash: string,
        siblingHashes: Array<{ hash: string; position: 'left' | 'right' }>
    ): MerkleProof {
        return {
            account_hash: accountHash,
            root_hash: rootHash,
            interaction_hash: interactionHash,
            path: siblingHashes
        };
    }
    
    /**
     * Calculate interaction hash (Task 17.2)
     * 
     * @param interaction - Interaction data
     * @returns SHA-256 hash of interaction
     */
    static calculateInteractionHash(interaction: any): string {
        // Create canonical JSON (sorted keys)
        const canonical = JSON.stringify(interaction, Object.keys(interaction).sort());
        
        // Calculate SHA-256 hash
        return crypto.createHash('sha256')
            .update(canonical)
            .digest('hex');
    }
    
    /**
     * Calculate account hash (Task 17.3)
     * 
     * @param publicKey - User's public key
     * @param interactionHashes - Array of interaction hashes
     * @returns SHA-256 hash of account
     */
    static calculateAccountHash(publicKey: string, interactionHashes: string[]): string {
        // Concatenate public key and all interaction hashes
        const data = publicKey + interactionHashes.join('');
        
        // Calculate SHA-256 hash
        return crypto.createHash('sha256')
            .update(data)
            .digest('hex');
    }
}

/**
 * Merkle Proof Verifier
 * 
 * Verifies cryptographic proofs for interactions in the Merkle Tree.
 */
export class MerkleProofVerifier {
    /**
     * Verify Merkle proof (Task 18.1, 18.2, 18.3)
     * 
     * @param proof - Merkle proof to verify
     * @param interaction - Interaction data
     * @returns True if proof is valid
     */
    static verifyProof(proof: MerkleProof, interaction: any): boolean {
        try {
            // Step 1: Calculate interaction hash
            const calculatedHash = MerkleProofGenerator.calculateInteractionHash(interaction);
            
            // Verify interaction hash matches
            if (calculatedHash !== proof.interaction_hash) {
                console.error('[MERKLE VERIFY] Interaction hash mismatch');
                return false;
            }
            
            // Step 2: Reconstruct path to root
            let currentHash = proof.interaction_hash;
            
            for (const sibling of proof.path) {
                // Combine with sibling hash
                const combined = sibling.position === 'left'
                    ? sibling.hash + currentHash
                    : currentHash + sibling.hash;
                
                // Hash the combination
                currentHash = crypto.createHash('sha256')
                    .update(combined)
                    .digest('hex');
            }
            
            // Step 3: Verify reconstructed hash matches account hash
            if (currentHash !== proof.account_hash) {
                console.error('[MERKLE VERIFY] Account hash mismatch');
                return false;
            }
            
            // Proof is valid
            return true;
            
        } catch (error) {
            console.error('[MERKLE VERIFY] Error verifying proof:', error);
            return false;
        }
    }
    
    /**
     * Verify proof against expected root hash (Task 18.3)
     * 
     * @param proof - Merkle proof
     * @param expectedRootHash - Expected root hash
     * @returns True if proof root matches expected root
     */
    static verifyRootHash(proof: MerkleProof, expectedRootHash: string): boolean {
        return proof.root_hash === expectedRootHash;
    }
}
