import { test, expect } from 'vitest';
import { derivePbkdf2Key, importPbkdf2Key } from '../pbkdf2.ts';

test('pbkdf2', async () => {
	const baseKey = await importPbkdf2Key('passphrase');
	const derived = await derivePbkdf2Key('salt', baseKey);
	expect(derived.algorithm.name).toBe('AES-CBC');
});
