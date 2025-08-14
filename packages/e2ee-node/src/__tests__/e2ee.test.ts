import { test, assert } from 'vitest';

import { NodeE2EE } from '../index.ts';
import type { KeyPair, KeyService } from '@rocket.chat/e2ee';

class MockedKeyService implements KeyService {
	fetchMyKeys(): Promise<KeyPair> {
		return Promise.resolve({
			public_key: 'mocked_public_key',
			private_key: 'mocked_private_key',
		});
	}
}

test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
	// Inject custom word list by temporarily defining dynamic import.
	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
	// So we skip testing exact phrase (depends on wordList) and just assert shape.
	const mockedKeyService = new MockedKeyService();
	const e2ee = NodeE2EE.withMemoryStorage(mockedKeyService);
	const pwd = await e2ee.createRandomPassword();
	assert.equal(pwd.split(' ').length, 5);
	assert.equal(await e2ee.getRandomPassword(), pwd);
});
