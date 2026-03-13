# 🏛️ DIOTEC 360 IA - Sovereign SDK

**"DIOTEC Inside" - Integrity as a Service**

The first universal SDK for mathematical verification of critical operations. Transform any app into a trustworthy system with one line of code.

[![npm version](https://img.shields.io/npm/v/@diotec360/sdk.svg)](https://www.npmjs.com/package/@diotec360/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Quick Start

### Installation

```bash
npm install @diotec360/sdk
```

### Basic Usage

```typescript
import { DiotecSDK } from '@diotec360/sdk';

const diotec = new DiotecSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Verify a money transfer
const result = await diotec.verify({
  intent: 'transfer',
  params: {
    from: 'account_123',
    to: 'account_456',
    amount: 1000,
    currency: 'AOA'
  }
});

if (result.verified) {
  console.log('✅ Transfer verified!');
  console.log('Merkle Proof:', result.merkleProof);
  console.log('Certificate:', result.certificateUrl);
} else {
  console.log('❌ Verification failed:', result.error);
}
```

---

## 🎯 Why DIOTEC 360 IA?

### The Problem

Apps lose millions due to bugs in critical operations:
- **Financial apps:** Incorrect calculations, double-spending
- **Voting apps:** Fraud, duplicate votes
- **Delivery apps:** Fake GPS, payment disputes
- **Healthcare apps:** Unauthorized prescriptions

### The Solution

DIOTEC 360 IA provides **mathematical proofs** that your critical operations are correct:
- ✅ **Formal Verification:** Z3 Theorem Prover (Microsoft technology)
- ✅ **Dual Audit:** Two independent systems validate
- ✅ **Merkle Proofs:** Immutable audit trail
- ✅ **One Line of Code:** No rewrite needed

---

## 📦 Features

### Universal Intent Templates

Pre-built verification logic for common use cases:

```typescript
import { Intents } from '@diotec360/sdk';

// Money transfer
const transfer = Intents.transfer('from', 'to', 1000, 'AOA');

// Escrow with conditions
const escrow = Intents.escrow('buyer', 'seller', 5000, [
  'delivery_confirmed',
  'quality_approved'
]);

// Voting
const vote = Intents.vote('voter_123', 'candidate_456', 'election_2026');

// GPS-verified delivery
const delivery = Intents.delivery('driver_123', 'order_456', -8.8383, 13.2344);

// Multi-signature
const multisig = Intents.multisig(['signer1', 'signer2'], 2, ['sig1', 'sig2']);
```

### Batch Verification

Verify multiple operations in one request:

```typescript
const results = await diotec.batchVerify([
  Intents.transfer('A', 'B', 100),
  Intents.transfer('B', 'C', 50),
  Intents.escrow('buyer', 'seller', 1000, ['delivered'])
]);

results.forEach((result, i) => {
  console.log(`Operation ${i}: ${result.verified ? '✅' : '❌'}`);
});
```

### Merkle Proofs

Every verification generates an immutable proof:

```typescript
const result = await diotec.verify(intent);

// Retrieve full proof details
const proof = await diotec.getProof(result.merkleProof);
console.log('Merkle Root:', proof.merkleRoot);
console.log('Merkle Path:', proof.merklePath);

// Download certificate
const cert = await diotec.getCertificate(result.certificateUrl);
console.log('Certificate:', cert);
```

---

## 🏦 Use Cases

### Financial Apps

```typescript
// Verify balance before transfer
const result = await diotec.verify({
  intent: 'transfer',
  params: {
    from: 'account_123',
    to: 'account_456',
    amount: 1000,
    balance: 5000  // Current balance
  }
});

// DIOTEC proves: balance - amount >= 0
```

### Voting Apps

```typescript
// Ensure one person, one vote
const result = await diotec.verify({
  intent: 'vote',
  params: {
    voterId: 'citizen_123',
    candidateId: 'candidate_456',
    electionId: 'election_2026',
    hasVoted: false,  // Check if already voted
    isEligible: true  // Check if eligible
  }
});

// DIOTEC proves: !hasVoted && isEligible
```

### Delivery Apps

```typescript
// Verify driver is at delivery location
const result = await diotec.verify({
  intent: 'delivery',
  params: {
    driverId: 'driver_123',
    orderId: 'order_456',
    currentLat: -8.8383,
    currentLon: 13.2344,
    targetLat: -8.8380,
    targetLon: 13.2340,
    maxDistance: 0.1  // km
  }
});

// DIOTEC proves: distance(current, target) <= maxDistance
```

### Healthcare Apps

```typescript
// Verify prescription authorization
const result = await diotec.verify({
  intent: 'prescription',
  params: {
    doctorId: 'doctor_123',
    patientId: 'patient_456',
    medication: 'aspirin',
    isAuthorized: true,
    hasLicense: true
  }
});

// DIOTEC proves: isAuthorized && hasLicense
```

---

## 🔐 Security

### API Key Management

```typescript
// Production environment
const prodDiotec = new DiotecSDK({
  apiKey: process.env.DIOTEC_API_KEY,
  environment: 'production'
});

// Sandbox for testing
const sandboxDiotec = new DiotecSDK({
  apiKey: process.env.DIOTEC_SANDBOX_KEY,
  environment: 'sandbox'
});
```

### Error Handling

```typescript
try {
  const result = await diotec.verify(intent);
  
  if (result.verified) {
    // Proceed with operation
  } else {
    // Handle verification failure
    console.error('Verification failed:', result.error);
  }
} catch (error) {
  // Handle network or API errors
  console.error('SDK error:', error);
}
```

### Debug Mode

```typescript
const diotec = new DiotecSDK({
  apiKey: 'your-api-key',
  environment: 'sandbox',
  debug: true  // Enable detailed logging
});
```

---

## 💰 Pricing

### Free Tier
- 1,000 verifications/month
- Sandbox environment
- Community support
- "Powered by DIOTEC 360" badge required

### Starter ($99/month)
- 10,000 verifications/month
- Production environment
- Email support
- Optional badge

### Professional ($499/month)
- 100,000 verifications/month
- Priority support
- Custom intent templates
- White-label option

### Enterprise (Custom)
- Unlimited verifications
- Dedicated support
- On-premise deployment
- SLA guarantee

[Get API Key →](https://diotec360.com/signup)

---

## 📚 Documentation

- [Quick Start Guide](https://docs.diotec360.com/quickstart)
- [API Reference](https://docs.diotec360.com/api)
- [Intent Templates](https://docs.diotec360.com/intents)
- [Examples](https://docs.diotec360.com/examples)
- [FAQ](https://docs.diotec360.com/faq)

---

## 🤝 Support

- **Email:** support@diotec360.com
- **Discord:** [Join our community](https://discord.gg/diotec360)
- **GitHub Issues:** [Report bugs](https://github.com/diotec-barros/diotec-360-ia-extension/issues)
- **Twitter:** [@diotec360](https://twitter.com/diotec360)

---

## 🏆 Built By

**Dionísio Sebastião Barros**  
Founder & Sovereign Architect  
DIOTEC 360 IA

**Kiro**  
Chief Engineer (Autonomous AI System)  
DIOTEC 360 IA Engineering Division

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🌍 Made in Angola

DIOTEC 360 IA is proudly built in Angola, Africa's first sovereign AI infrastructure.

🏛️ **DIOTEC 360 IA** - The TCP/IP of Honesty  
⚖️ **Sovereign SDK** - Integrity as a Service  
🛡️ **"DIOTEC Inside"** - Every App, Everywhere

---

**Transform your app into a trustworthy system. Start verifying today.** 🚀
