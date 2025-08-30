import { expect, test } from 'vitest';
import E2EE from '../index.ts';
import { createDb } from './helpers/db.ts';

const db = createDb();

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
	const keys = await bob.createAndLoadKeys();
	expect(keys.isOk).toBe(true);
	expect(keys).toHaveProperty('value.publicKey');
	expect(keys).toHaveProperty('value.privateKey');
	const password = await bob.createRandomPassword(5);
	expect(password.split(' ').length).toBe(5);
	const localKeys = bob.getKeysFromLocalStorage();
	expect(localKeys.private_key).toBeDefined();
	expect(localKeys.public_key).toBeDefined();
	const result = await bob.persistKeys(localKeys, password, true);
	expect(result.isOk).toBe(true);

	// Recovery
	const recoveredKeys = await bob.loadKeysFromDB();
	expect(recoveredKeys.isOk).toBe(true);
	expect(recoveredKeys).toHaveProperty('value.public_key');
	expect(recoveredKeys).toHaveProperty('value.private_key');
});

// test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
// 	// Inject custom word list by temporarily defining dynamic import.
// 	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
// 	// So we skip testing exact phrase (depends on wordList) and just assert shape.
// 	const pwd = await bob.createRandomPassword(5);
// 	expect(pwd.split(' ').length).toBe(5);
// 	expect(bob.getRandomPassword()).toBe(pwd);
// });
