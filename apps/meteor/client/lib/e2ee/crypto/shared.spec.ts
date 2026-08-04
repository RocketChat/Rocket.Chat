import { generateKey, generateKeyPair, exportKey, importJwk, encryptBuffer, decryptBuffer, getRandomValues } from './shared';

describe('Shared Crypto Functions', () => {
	describe('generateKey', () => {
		it('should generate an AES key with correct properties', async () => {
			const key = await generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
			expect<'AES-GCM'>(key.algorithm.name).toBe('AES-GCM');
			expect<256>(key.algorithm.length).toBe(256);
			expect<true>(key.extractable).toBe(true);
			expect<'secret'>(key.type).toBe('secret');
			expect<2>(key.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(key.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
		});

		it('should export a key to JWK format', async () => {
			const key = await generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt']);
			const exportedKey = await exportKey('jwk', key);
			expect(Object.keys(exportedKey)).toHaveLength(5);
			expect<true>(exportedKey.ext).toBe(true);
			expect<'oct'>(exportedKey.kty).toBe('oct');
			expect<string>(exportedKey.k).toHaveLength(22); // 128 bits in base64url
			expect<`A128CBC`>(exportedKey.alg).toBe('A128CBC');
			expect<['encrypt']>(exportedKey.key_ops).toEqual(['encrypt']);
		});
	});

	describe('generateKeyPair', () => {
		it('should generate an RSA key pair with correct properties', async () => {
			const keyPair = await generateKeyPair(
				{
					name: 'RSA-OAEP',
					modulusLength: 2048,
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: { name: 'SHA-256' },
				},
				true,
				['encrypt', 'decrypt'],
			);

			expect<'RSA-OAEP'>(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP');
			expect<2048>(keyPair.publicKey.algorithm.modulusLength).toBe(2048);
			expect<true>(keyPair.publicKey.extractable).toBe(true);
			expect<'public'>(keyPair.publicKey.type).toBe('public');
			expect<1>(keyPair.publicKey.usages.length).toBe(1);
			expect<['encrypt']>(keyPair.publicKey.usages).toEqual(['encrypt']);

			expect<'RSA-OAEP'>(keyPair.privateKey.algorithm.name).toBe('RSA-OAEP');
			expect<2048>(keyPair.privateKey.algorithm.modulusLength).toBe(2048);
			expect<true>(keyPair.privateKey.extractable).toBe(true);
			expect<'private'>(keyPair.privateKey.type).toBe('private');
			expect<1>(keyPair.privateKey.usages.length).toBe(1);
			expect<['decrypt']>(keyPair.privateKey.usages).toEqual(['decrypt']);
		});
	});

	describe('importKey', () => {
		it('should import an AES key from JWK format', async () => {
			const key = await importJwk(
				{
					kty: 'oct' as const,
					k: 'qb8In0Rpa9nwSusvxxDcbQ',
					key_ops: ['encrypt', 'decrypt'] as const,
					ext: true,
					alg: 'A128CBC' as const,
				},
				{ name: 'AES-CBC', length: 128 },
				true,
				['encrypt', 'decrypt'],
			);
			expect<128>(key.algorithm.length).toBe(128);
			expect<'AES-CBC'>(key.algorithm.name).toBe('AES-CBC');
			expect<true>(key.extractable).toBe(true);
			expect<'secret'>(key.type).toBe('secret');
			expect<2>(key.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(key.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
		});
	});

	describe('exportKey', () => {
		it('should export an RSA public key to JWK format', async () => {
			const keyPair = await generateKeyPair(
				{
					name: 'RSA-OAEP',
					modulusLength: 2048,
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: { name: 'SHA-256' },
				},
				true,
				['encrypt', 'decrypt'],
			);
			const exportedKey = await exportKey('jwk', keyPair.publicKey);
			expect(Object.keys(exportedKey).toSorted()).toEqual(['alg', 'e', 'ext', 'key_ops', 'kty', 'n'].toSorted());
			expect<true>(exportedKey.ext).toBe(true);
			expect<'RSA'>(exportedKey.kty).toBe('RSA');
			expect<`RSA-OAEP-256`>(exportedKey.alg).toBe('RSA-OAEP-256');
			expect<['encrypt']>(exportedKey.key_ops).toEqual(['encrypt']);
			expect<string>(exportedKey.n).toBeDefined();
			expect<string>(exportedKey.e).toBeDefined();
		});

		it('should export an RSA private key to JWK format', async () => {
			const keyPair = await generateKeyPair(
				{
					name: 'RSA-OAEP',
					modulusLength: 2048,
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: { name: 'SHA-256' },
				},
				true,
				['encrypt', 'decrypt'],
			);
			const exportedKey = await exportKey('jwk', keyPair.privateKey);
			expect(Object.keys(exportedKey).toSorted()).toEqual(
				['alg', 'd', 'dp', 'dq', 'e', 'ext', 'key_ops', 'kty', 'n', 'p', 'q', 'qi'].toSorted(),
			);
			expect<true>(exportedKey.ext).toBe(true);
			expect<'RSA'>(exportedKey.kty).toBe('RSA');
			expect<`RSA-OAEP-256`>(exportedKey.alg).toBe('RSA-OAEP-256');
			expect<['decrypt']>(exportedKey.key_ops).toEqual(['decrypt']);
			expect<string>(exportedKey.n).toBeDefined();
			expect<string>(exportedKey.e).toBeDefined();
			expect<string>(exportedKey.d).toBeDefined();
			expect<string>(exportedKey.p).toBeDefined();
			expect<string>(exportedKey.q).toBeDefined();
			expect<string>(exportedKey.dp).toBeDefined();
			expect<string>(exportedKey.dq).toBeDefined();
			expect<string>(exportedKey.qi).toBeDefined();
		});
	});

	describe('encryptBuffer', () => {
		it('should encrypt and decrypt data correctly', async () => {
			const key = await generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
			const plaintext = new TextEncoder().encode('Test encryption');
			const iv = getRandomValues(new Uint8Array(12));
			const ciphertext = await encryptBuffer(key, { name: 'AES-GCM', iv }, plaintext);
			const decrypted = await decryptBuffer(key, { name: 'AES-GCM', iv }, ciphertext);
			expect(new TextDecoder().decode(decrypted)).toBe('Test encryption');
		});
	});
});
