# Security Policy

## Reporting a Vulnerability

**DIOTEC 360** takes security seriously. If you discover a security vulnerability in the DIOTEC 360 IA Extension, please report it privately.

### How to Report

**Email**: security@diotec360.com

**Please include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 24 hours
- **Status Update**: Within 3 days
- **Fix Timeline**: Varies by severity

### Disclosure Policy

We follow responsible disclosure practices:
1. Report received and acknowledged
2. Vulnerability validated and assessed
3. Fix developed and tested
4. Security advisory published
5. Credit given to reporter (unless anonymity requested)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Security Features

- API keys stored in VS Code SecretStorage (encrypted)
- No telemetry or external data collection
- Local SQLite database only
- All LLM calls use user's own API keys

## Best Practices

When using DIOTEC 360 IA Extension:
1. Never commit API keys to version control
2. Use environment variables for sensitive data
3. Review generated code before applying
4. Keep the extension updated

---

**Copyright 2024-2026 Dionísio Sebastião Barros / DIOTEC 360**
