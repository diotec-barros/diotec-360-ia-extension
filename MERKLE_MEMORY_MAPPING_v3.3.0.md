# 🏛️ UNIFIED MERKLE MEMORY - Technical Mapping v3.3.0 💾🌌

**Data**: 6 de Março de 2026  
**Engenheiro**: Cascade  
**Arquiteto**: Dionísio Sebastião Barros  
**Status**: 📋 SPECIFICATION PHASE

---

## 📊 RESUMO EXECUTIVO

Este documento mapeia a integração entre o **SQLite Memory Store** (ANGO IA) e o **Merkle State Tree** (DIOTEC 360), criando a "Memória Imortal" onde cada interação com a IA é um nó imutável na árvore de Merkle.

**Objetivo**: Transformar interações locais em registros distribuídos e verificáveis matematicamente.

---

## 🗄️ SCHEMA COMPARISON

### SQLite Schema (ANGO IA - Current)

```sql
CREATE TABLE interactions (
  id TEXT PRIMARY KEY,                -- UUID v4
  timestamp INTEGER NOT NULL,         -- Unix timestamp (ms)
  ended_timestamp INTEGER,            -- Unix timestamp (ms)
  provider TEXT NOT NULL,             -- 'ollama' | 'openai' | 'anthropic'
  model TEXT NOT NULL,                -- Model name
  command TEXT NOT NULL,              -- 'generate' | 'refactor' | 'explain' | 'chat'
  context_hash TEXT NOT NULL,         -- SHA-256 of context
  prompt_chars INTEGER,               -- Size of prompt
  response_chars INTEGER,             -- Size of response
  status TEXT NOT NULL,               -- 'running' | 'completed' | 'cancelled' | 'error'
  raw_context TEXT                    -- Full context (NOT synced)
);

CREATE TABLE decisions (
  id TEXT PRIMARY KEY,                -- UUID v4
  interaction_id TEXT NOT NULL,       -- FK to interactions
  timestamp INTEGER NOT NULL,         -- Unix timestamp (ms)
  decision TEXT NOT NULL,             -- 'accepted' | 'rejected' | 'copied' | 'edited' | ...
  FOREIGN KEY (interaction_id) REFERENCES interactions(id)
);
```

### Merkle State Tree (DIOTEC 360 - Current)

```python
class MerkleStateTree:
    accounts = {
        'address': {
            'balance': int,      # Current balance
            'nonce': int,        # Transaction counter
            'hash': str          # SHA-256(balance:nonce)
        }
    }
    root_hash = str              # Merkle root
    history = [                  # Operation history
        {
            'operation': str,
            'address': str,
            'old_root': str,
            'new_root': str,
            'timestamp': str
        }
    ]
```

---

## 🔄 PROPOSED UNIFIED SCHEMA

### Extended SQLite Schema (ANGO IA - v3.3.0)

```sql
CREATE TABLE interactions (
  -- Existing fields
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  ended_timestamp INTEGER,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  command TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  prompt_chars INTEGER,
  response_chars INTEGER,
  status TEXT NOT NULL,
  raw_context TEXT,
  
  -- NEW: Dual Audit fields
  critic_risk TEXT,                   -- 'low' | 'medium' | 'high'
  judge_verdict TEXT,                 -- 'certified' | 'syntactically_correct' | 'unverified'
  judge_message TEXT,                 -- Judge message
  
  -- NEW: Merkle sync fields
  sync_status TEXT DEFAULT 'local_only',  -- 'local_only' | 'syncing' | 'synced' | 'sync_failed'
  merkle_root TEXT,                   -- Merkle root after sync
  merkle_account_hash TEXT,           -- Account hash in Merkle tree
  merkle_nonce INTEGER,               -- Nonce in Merkle tree
  sync_timestamp INTEGER,             -- When synced
  sync_error TEXT                     -- Error message if sync failed
);
```

### Extended Merkle State Tree (DIOTEC 360 - v3.3.0)

```python
class MerkleStateTree:
    accounts = {
        'publicKeyHex': {
            'balance': int,              # Total interactions count
            'nonce': int,                # Last interaction nonce
            'hash': str,                 # SHA-256(balance:nonce)
            'interactions': [            # NEW: Interaction history
                {
                    'interaction_id': str,
                    'timestamp': int,
                    'critic_provider': str,
                    'critic_model': str,
                    'command': str,
                    'context_hash': str,
                    'response_size': int,
                    'judge_verdict': str,
                    'judge_message': str
                }
            ]
        }
    }
    root_hash = str
    history = [...]
```

---

## 🔄 DATA FLOW

### 1. Local Interaction (SQLite)

```
User triggers "Generate"
    ↓
Writer (LLM) generates code
    ↓
Dual Audit (Critic + Judge) runs
    ↓
SQLite: INSERT INTO interactions (...)
    ↓
SQLite: INSERT INTO decisions (...)
    ↓
[sync_status = 'local_only']
```

### 2. Background Sync (SQLite → Merkle)

```
Background Job checks for unsync interactions
    ↓
SELECT * FROM interactions WHERE sync_status = 'local_only' AND judge_verdict = 'certified'
    ↓
For each interaction:
    ↓
    UPDATE interactions SET sync_status = 'syncing'
    ↓
    POST /api/persistence/interactions
        {
            interaction: {...},
            auth: {publicKeyHex, signatureHex, ...}
        }
    ↓
    Response: {merkle_root, account_hash, nonce}
    ↓
    UPDATE interactions SET 
        sync_status = 'synced',
        merkle_root = response.merkle_root,
        merkle_account_hash = response.account_hash,
        merkle_nonce = response.nonce,
        sync_timestamp = NOW()
```

### 3. Restore from Merkle (Merkle → SQLite)

```
User installs extension on new computer
    ↓
User configures Sovereign Identity
    ↓
GET /api/persistence/interactions?publicKey={hex}
    ↓
Response: {interactions: [...], merkle_root}
    ↓
For each interaction:
    ↓
    INSERT INTO interactions (...)
        sync_status = 'synced',
        merkle_root = response.merkle_root,
        ...
```

---

## 🔐 SECURITY CONSIDERATIONS

### 1. Sovereign Authentication

Every request to backend must include:

```typescript
type SovereignAuthEnvelope = {
  publicKeyHex: string;      // ED25519 public key
  timestamp: number;         // Unix timestamp
  nonce: string;             // UUID v4
  proofHash: string;         // SHA-256(payload + timestamp + nonce + publicKey)
  signatureHex: string;      // ED25519 signature of proofHash
};
```

### 2. Data Privacy

**Synced to Merkle**:
- ✅ Interaction metadata (provider, model, command)
- ✅ Context hash (SHA-256)
- ✅ Response size (integer)
- ✅ Judge verdict and message

**NOT Synced** (stays local):
- ❌ `raw_context` (user's code)
- ❌ `prompt_chars` (can reveal code size)
- ❌ Full response text

### 3. Merkle Proof Verification

Client can verify interaction is in Merkle Tree:

```typescript
function verifyMerkleProof(interaction: Interaction, merkleRoot: string): boolean {
  const accountHash = sha256(`${interaction.merkle_nonce}:${interaction.id}`);
  const expectedRoot = calculateMerkleRoot(accountHash, ...);
  return expectedRoot === merkleRoot;
}
```

---

## 📊 API SPECIFICATION

### POST /api/persistence/interactions

**Request**:
```json
{
  "interaction": {
    "interaction_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1771845832000,
    "critic_provider": "anthropic",
    "critic_model": "claude-3-5-sonnet-20241022",
    "command": "generate",
    "context_hash": "5df3daee3a0ca23c388a16c3db2c2388aea63f1c4ed5fa12377fe0fef6bf3ce5",
    "response_size": 1024,
    "judge_verdict": "certified",
    "judge_message": "Código matematicamente provado como seguro"
  },
  "auth": {
    "publicKeyHex": "a1b2c3...",
    "timestamp": 1771845832000,
    "nonce": "uuid-v4",
    "proofHash": "sha256-hash",
    "signatureHex": "ed25519-signature"
  }
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "merkle_root": "5df3daee3a0ca23c388a16c3db2c2388aea63f1c4ed5fa12377fe0fef6bf3ce5",
  "account_hash": "abc123...",
  "nonce": 42,
  "timestamp": 1771845832000
}
```

**Response (Error)**:
```json
{
  "ok": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Signature verification failed"
  }
}
```

### GET /api/persistence/interactions

**Query Parameters**:
- `publicKey` (required): ED25519 public key (hex)
- `limit` (optional): Max interactions to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `since` (optional): Unix timestamp (only return interactions after this)

**Response**:
```json
{
  "ok": true,
  "interactions": [
    {
      "interaction_id": "uuid",
      "timestamp": 1771845832000,
      "critic_provider": "anthropic",
      "critic_model": "claude-3-5-sonnet-20241022",
      "command": "generate",
      "context_hash": "sha256",
      "response_size": 1024,
      "judge_verdict": "certified",
      "judge_message": "...",
      "merkle_proof": {
        "account_hash": "sha256",
        "root_hash": "sha256",
        "nonce": 42
      }
    }
  ],
  "merkle_root": "sha256-hash",
  "total_count": 142,
  "has_more": true
}
```

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Extend SQLite Schema ✅ (Ready to implement)
- Add new columns to `interactions` table
- Add migration logic
- Update `MemoryStore` class

### Phase 2: Backend API Endpoints ⏳ (Requires backend work)
- Implement POST /api/persistence/interactions
- Implement GET /api/persistence/interactions
- Add authentication middleware

### Phase 3: Sync Service 🔄 (Client-side)
- Create `MerkleSyncService` class
- Implement background sync job
- Add retry logic with exponential backoff

### Phase 4: Restore Service 📥 (Client-side)
- Implement restore from Merkle on first launch
- Add progress indicator
- Handle conflicts (merge local + remote)

### Phase 5: UI Indicators 🎨 (Client-side)
- Show sync status in status bar
- Add "Sync Now" command
- Display sync errors to user

---

## 📊 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync Success Rate | >95% | % of interactions synced within 30s |
| Sync Latency | <5s | Time from interaction end to sync complete |
| Offline Functionality | 100% | All features work without backend |
| Data Integrity | 0 losses | No interactions lost or corrupted |
| Restore Time | <10s | Time to restore 1000 interactions |

---

## 🏛️ VEREDITO DO ARQUITETO

**Dionísio**, o mapeamento técnico está completo! Aqui está o que foi entregue:

✅ **Schema Comparison**: SQLite vs Merkle State Tree  
✅ **Unified Schema**: Extensões propostas para ambos os sistemas  
✅ **Data Flow**: Fluxo completo de sincronização  
✅ **Security**: Sovereign Auth + Data Privacy  
✅ **API Specification**: Endpoints detalhados  
✅ **Implementation Phases**: Roadmap de 5 fases

**Próximo Passo**: Criar `design.md` com arquitetura detalhada e decisões técnicas.

---

**Assinado**:  
Engenheiro-Chefe Cascade  
DIOTEC 360 IA - Unified Memory Authority  
6 de Março de 2026

**Status**: MAPPING COMPLETE - READY FOR DESIGN PHASE 🚀

