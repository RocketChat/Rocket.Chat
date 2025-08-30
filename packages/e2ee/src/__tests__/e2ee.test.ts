import { expect, test } from 'vitest';
import E2EE from '../index.ts';
import { createDb } from './helpers/db.ts';
import type { Result } from '../result.ts';

const db = createDb();
export const unwrap = <V, E>(result: Result<V, E>): V => {
	if (result.isOk) {
		return result.value;
	}
	throw new Error('Unwrapped a failed result');
};

const bob = new E2EE({
	fetchMyKeys: async () => {
		return await db.get('bob');
	},
	userId: async () => 'bob',
	persistKeys: (keys, force) => {
		return db.set('bob', keys, force);
	},
});

test('load user keys', async () => {
	const keys = unwrap(await bob.createAndLoadKeys());
	expect(keys).toHaveProperty('publicKey');
	expect(keys).toHaveProperty('privateKey');
	const password = await bob.createRandomPassword(5);
	expect(password.split(' ').length).toBe(5);
	expect(bob.getRandomPassword()).toBe(password);
	bob.removeRandomPassword();
	expect(bob.getRandomPassword()).toBeFalsy();
	const localKeys = bob.getKeysFromLocalStorage();
	expect(localKeys.private_key).toBeDefined();
	expect(localKeys.public_key).toBeDefined();
	unwrap(await bob.persistKeys(localKeys, password, true));

	// Recovery
	const recoveredKeys = unwrap(await bob.loadKeysFromDB());
	expect(recoveredKeys).toHaveProperty('public_key');
	expect(recoveredKeys).toHaveProperty('private_key');

	// Wrong password
	expect(await bob.decodePrivateKey(recoveredKeys.private_key, 'wrong password')).toHaveProperty('error');

	// Load keys
	const decodedKey = unwrap(await bob.decodePrivateKey(recoveredKeys.private_key, password));
	const privateKey = unwrap(
		await bob.loadKeys({
			private_key: decodedKey,
			public_key: recoveredKeys.public_key,
		}),
	);

	expect(privateKey).toBeInstanceOf(CryptoKey);

	// Remove keys from local storage
	bob.removeKeysFromLocalStorage();
	expect(bob.getKeysFromLocalStorage()).toMatchObject({ private_key: null, public_key: null });
});

// test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
// 	// Inject custom word list by temporarily defining dynamic import.
// 	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
// 	// So we skip testing exact phrase (depends on wordList) and just assert shape.
// 	const pwd = await bob.createRandomPassword(5);
// 	expect(pwd.split(' ').length).toBe(5);
// 	expect(bob.getRandomPassword()).toBe(pwd);
// });
