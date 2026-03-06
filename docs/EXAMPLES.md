# Usage Examples

## Generate Command

### Example 1: Generate a Function

**Selection:**
```typescript
// TODO: implement user validation
```

**Result:**
```typescript
function validateUser(user: { email: string; password: string }): boolean {
  if (!user.email || !user.email.includes('@')) {
    return false;
  }
  if (!user.password || user.password.length < 8) {
    return false;
  }
  return true;
}
```

### Example 2: Generate Tests

**Selection:**
```typescript
function add(a: number, b: number): number {
  return a + b;
}
// generate tests
```

**Result:**
```typescript
describe('add', () => {
  it('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should handle zero', () => {
    expect(add(0, 5)).toBe(5);
  });
});
```

## Explain Command

### Example: Explain Complex Code

**Selection:**
```typescript
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};
```

**Result:**
```markdown
## Memoization Function

This is a generic memoization utility that caches function results.

### How it works:
1. Creates a Map to store cached results
2. Returns a wrapper function that:
   - Serializes arguments to create a cache key
   - Returns cached result if available
   - Otherwise calls original function and caches result

### Type Safety:
- Generic type `T` preserves the original function signature
- Type assertion ensures return type matches input function

### Use Case:
Optimize expensive computations by caching results based on inputs.

### Limitations:
- JSON.stringify may not work for all argument types (functions, symbols)
- Cache grows indefinitely (no eviction strategy)
```

## Refactor Command

### Example: Improve Code Quality

**Selection:**
```typescript
function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].active == true) {
      result.push({
        id: data[i].id,
        name: data[i].name,
        value: data[i].value * 2
      });
    }
  }
  return result;
}
```

**Result:**
```typescript
function processData(data: Array<{ id: string; name: string; value: number; active: boolean }>) {
  return data
    .filter(item => item.active)
    .map(item => ({
      id: item.id,
      name: item.name,
      value: item.value * 2
    }));
}
```

## Chat Command

### Example 1: Ask About Code

**User Input:**
```
How can I make this function more efficient?
```

**Context:** Selected code showing a nested loop

**Response:**
```markdown
The nested loop has O(n²) complexity. Here are optimization strategies:

1. **Use a Map for lookups** - Convert inner array to Map for O(1) access
2. **Early termination** - Break when match is found
3. **Filter first** - Reduce dataset before processing

Example with Map:
```typescript
const lookup = new Map(innerArray.map(item => [item.id, item]));
const results = outerArray.map(item => lookup.get(item.id)).filter(Boolean);
```

This reduces complexity to O(n).
```

### Example 2: Project Context Question

**User Input:**
```
What files handle authentication in this project?
```

**Response:**
```markdown
Based on the open files, authentication appears to be handled in:

1. `src/auth/middleware.ts` - Likely contains auth middleware
2. `src/auth/service.ts` - Authentication service logic
3. `src/config/secrets.ts` - API key/secret management

To see the actual implementation, I'd need to view the file contents.
Would you like me to explain any specific file?
```

## MoE (Mixture of Experts) Examples

### Generate with Critic Review

**Generated Code:**
```typescript
function deleteUser(userId: string) {
  database.query(`DELETE FROM users WHERE id = ${userId}`);
}
```

**Critic Review:**
```markdown
## Risk
high

## Issues
1. **SQL Injection Vulnerability** - Direct string interpolation in SQL query
2. **No Error Handling** - Database errors not caught
3. **No Validation** - userId not validated before use

## Recommendations
- Use parameterized queries
- Add try-catch block
- Validate userId format
- Consider soft delete instead of hard delete

## Suggested Fix
```typescript
async function deleteUser(userId: string): Promise<void> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  try {
    await database.query('DELETE FROM users WHERE id = ?', [userId]);
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}
```
```

### Refactor with Low Risk

**Generated Code:**
```typescript
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
```

**Critic Review:**
```markdown
## Risk
low

## Analysis
Clean, simple implementation with no obvious issues.

## Notes
- Pure function with no side effects
- Type-safe with TypeScript
- Uses standard Date API
- Consider timezone implications for your use case
```

## Memory Export Example

**Command:** "ANGO IA: Open Memory DB"

**Result:**
```json
{
  "interactions": [
    {
      "id": "abc-123",
      "timestamp": 1704067200000,
      "provider": "ollama",
      "model": "llama3",
      "command": "generate",
      "context_hash": "a1b2c3...",
      "prompt_chars": 1250,
      "response_chars": 450,
      "status": "completed"
    }
  ],
  "decisions": [
    {
      "id": "def-456",
      "interaction_id": "abc-123",
      "timestamp": 1704067210000,
      "decision": "accepted"
    },
    {
      "id": "ghi-789",
      "interaction_id": "abc-123",
      "timestamp": 1704067215000,
      "decision": "moe_reviewed"
    },
    {
      "id": "jkl-012",
      "interaction_id": "abc-123",
      "timestamp": 1704067216000,
      "decision": "moe_risk_low"
    }
  ]
}
```
