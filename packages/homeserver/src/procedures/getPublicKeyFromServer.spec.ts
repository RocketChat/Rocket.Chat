import { expect, it, describe, beforeEach, afterEach } from 'bun:test';
import { getPublicKeyFromRemoteServer } from './getPublicKeyFromServer';
import { EncryptionValidAlgorithm, encodeCanonicalJson } from '../signJson';
import { generateKeyPairs } from '../keys';
import nacl from 'tweetnacl';

describe('getPublicKeyFromRemoteServer', () => {
	let originalFetch: typeof globalThis.fetch;
	let mockServerKeys: {
		server_name: string;
		verify_keys: Record<string, { key: string }>;
		old_verify_keys: Record<string, never>;
		signatures: Record<string, Record<string, string>>;
		valid_until_ts: number;
	};

	const createValidServerKeyResponse = async () => {
		const seed = nacl.randomBytes(32);
		const keyPair = await generateKeyPairs(
			seed,
			EncryptionValidAlgorithm.ed25519,
			'test_key',
		);
		const serverName = 'test.server';
		const keyId = `${keyPair.algorithm}:${keyPair.version}`;
		const validUntil = Date.now() + 24 * 60 * 60 * 1000;

		const serverKey = {
			server_name: serverName,
			old_verify_keys: {},
			valid_until_ts: validUntil,
			verify_keys: {
				[keyId]: {
					key: Buffer.from(keyPair.publicKey).toString('base64'),
				},
			},
		};

		const canonicalJson = encodeCanonicalJson(serverKey);
		const signature = await keyPair.sign(
			new TextEncoder().encode(canonicalJson),
		);

		return {
			...serverKey,
			signatures: {
				[serverName]: {
					[keyId]: Buffer.from(signature).toString('base64'),
				},
			},
		};
	};

	beforeEach(async () => {
		originalFetch = globalThis.fetch;
		mockServerKeys = await createValidServerKeyResponse();

		const mockFetch = async (input: RequestInfo | URL) => {
			const url = input.toString();
			if (url.includes('/_matrix/key/v2/server')) {
				return new Response(JSON.stringify(mockServerKeys), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(null, { status: 404 });
		};
		mockFetch.preconnect = async () => undefined;
		globalThis.fetch = mockFetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should successfully retrieve and validate a public key', async () => {
		const domain = 'test.server';
		const origin = 'test.server';
		const algorithmAndVersion = `${EncryptionValidAlgorithm.ed25519}:test_key`;

		const result = await getPublicKeyFromRemoteServer(
			domain,
			origin,
			algorithmAndVersion,
		);

		expect(result).toBeDefined();
		expect(result.key).toBeDefined();
		expect(result.validUntil).toBeNumber();
		expect(result.validUntil).toBeGreaterThan(Date.now());
	});

	it('should throw error when server key is expired', async () => {
		mockServerKeys.valid_until_ts = Date.now() - 1000;

		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				`${EncryptionValidAlgorithm.ed25519}:test_key`,
			),
		).rejects.toThrow('Expired remote public key');
	});

	it('should throw error when public key is not found', async () => {
		mockServerKeys.verify_keys = {};

		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				`${EncryptionValidAlgorithm.ed25519}:test_key`,
			),
		).rejects.toThrow('Public key not found');
	});

	it('should throw error for invalid algorithm', async () => {
		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				'invalid_alg:test_key',
			),
		).rejects.toThrow('Invalid algorithm');
	});

	it('should throw error for invalid algorithm format', async () => {
		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				'invalid_algorithm_format',
			),
		).rejects.toThrow('Invalid algorithm and version format');
	});

	it('should handle network errors gracefully', async () => {
		const errorFetch = async () => {
			throw new Error('Network error');
		};
		errorFetch.preconnect = async () => undefined;
		globalThis.fetch = errorFetch;

		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				`${EncryptionValidAlgorithm.ed25519}:test_key`,
			),
		).rejects.toThrow();
	});

	it('should handle invalid server response', async () => {
		const invalidJsonFetch = async () => {
			return new Response('invalid json', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		};
		invalidJsonFetch.preconnect = async () => undefined;
		globalThis.fetch = invalidJsonFetch;

		await expect(
			getPublicKeyFromRemoteServer(
				'test.server',
				'test.server',
				`${EncryptionValidAlgorithm.ed25519}:test_key`,
			),
		).rejects.toThrow();
	});

	it('should successfully retrieve and validate a public key with different algorithm version', async () => {
		const seed = nacl.randomBytes(32);
		const keyPair = await generateKeyPairs(
			seed,
			EncryptionValidAlgorithm.ed25519,
			'another_version',
		);
		const serverName = 'test.server';
		const keyId = `${keyPair.algorithm}:${keyPair.version}`;

		const specialMockFetch = async (input: RequestInfo | URL) => {
			const url = input.toString();
			if (url.includes('/_matrix/key/v2/server')) {
				const baseServerKey = {
					server_name: serverName,
					old_verify_keys: {},
					valid_until_ts: Date.now() + 24 * 60 * 60 * 1000,
					verify_keys: {
						[keyId]: {
							key: Buffer.from(keyPair.publicKey).toString('base64'),
						},
					},
				};

				const canonicalJson = encodeCanonicalJson(baseServerKey);
				const signature = await keyPair.sign(
					new TextEncoder().encode(canonicalJson),
				);

				const fullServerKey = {
					...baseServerKey,
					signatures: {
						[serverName]: {
							[keyId]: Buffer.from(signature).toString('base64'),
						},
					},
				};

				return new Response(JSON.stringify(fullServerKey), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(null, { status: 404 });
		};
		specialMockFetch.preconnect = async () => undefined;
		globalThis.fetch = specialMockFetch;

		const result = await getPublicKeyFromRemoteServer(
			serverName,
			serverName,
			keyId,
		);

		expect(result).toBeDefined();
		expect(result.key).toBeDefined();
		expect(result.validUntil).toBeNumber();
		expect(result.validUntil).toBeGreaterThan(Date.now());
	});
});
