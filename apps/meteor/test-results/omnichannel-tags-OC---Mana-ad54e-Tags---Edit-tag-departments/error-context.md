# Test info

- Name: OC - Manage Tags >> OC - Manage Tags - Edit tag departments
- Location: /Users/guilhermegazzo/dev/Rocket.Chat/apps/meteor/.sim-annotation/omnichannel-tags.spec.ts:4:6

# Error details

```
Error: contextual bar should be dismissed after save

expect(received).toBe(expected) // Object.is equality

Expected: "not visible"
Received: "visible"

Call Log:
- Timeout 1ms exceeded while waiting on the predicate
    at /Users/guilhermegazzo/dev/Rocket.Chat/apps/meteor/.sim-annotation/omnichannel-tags.spec.ts:8:7
    at /Users/guilhermegazzo/dev/Rocket.Chat/apps/meteor/.sim-annotation/omnichannel-tags.spec.ts:5:14
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('OC - Manage Tags', () => {
   4 | 	test('OC - Manage Tags - Edit tag departments', async () => {
   5 | 		await test.step('expect to add tag departments', async () => {
   6 | 			await expect(async () => {
   7 | 				expect('visible', 'contextual bar should be dismissed after save').toBe('not visible');
>  8 | 			}).toPass({ timeout: 1 });
     | 			   ^ Error: contextual bar should be dismissed after save
   9 | 		});
  10 | 	});
  11 | });
  12 |
```