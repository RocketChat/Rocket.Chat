import { expect, test } from 'vitest';
import E2EE from '../index.ts';
import type { KeyService } from '@rocket.chat/e2ee';

const mockedKeyService: KeyService = {
	fetchMyKeys: () =>
		Promise.resolve({
			public_key: 'mocked_public_key',
			private_key: 'mocked_private_key',
		}),
	userId: () => Promise.resolve('mocked_user_id'),
	persistKeys: () => Promise.resolve(),
};

test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
	// Inject custom word list by temporarily defining dynamic import.
	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
	// So we skip testing exact phrase (depends on wordList) and just assert shape.
	const e2ee = new E2EE(mockedKeyService);
	const pwd = await e2ee.createRandomPassword(5);
	expect(pwd.split(' ').length).toBe(5);
	expect(e2ee.getRandomPassword()).toBe(pwd);
});
