import { generate, decrypt, encrypt, exportJwk, importKey, type Key } from './aes';

describe('aes', () => {
	describe('256-gcm', () => {
		let key: Key<{ name: 'AES-GCM'; length: 256 }>;

		beforeAll(async () => {
			key = await generate();
		});

		it('generate a key with correct properties', async () => {
			expect<256>(key.algorithm.length).toBe(256);
			expect<'AES-GCM'>(key.algorithm.name).toBe('AES-GCM');
			expect<true>(key.extractable).toBe(true);
			expect<'secret'>(key.type).toBe('secret');
			expect<2>(key.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(key.usages).toEqual(['encrypt', 'decrypt']);
		});

		it('should encrypt and decrypt data correctly', async () => {
			const plaintext = new TextEncoder().encode('Hello, world!');
			const ciphertext = await encrypt(key, plaintext);
			const decrypted = await decrypt(key, ciphertext);
			expect(decrypted).toBe('Hello, world!');
		});

		it('should export and re-import the key correctly', async () => {
			const jwk = await exportJwk(key);
			const importedKey = await importKey(jwk);
			expect<256>(importedKey.algorithm.length).toBe(256);
			expect<'AES-GCM'>(importedKey.algorithm.name).toBe('AES-GCM');
			expect<true>(importedKey.extractable).toBe(true);
			expect<'secret'>(importedKey.type).toBe('secret');
			expect<2>(importedKey.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(importedKey.usages).toEqual(['encrypt', 'decrypt']);
		});
	});

	describe('128-cbc', () => {
		let key: Key<{ name: 'AES-CBC'; length: 128 }>;

		beforeAll(async () => {
			key = await importKey({ alg: 'A128CBC', ext: true, k: 'qb8In0Rpa9nwSusvxxDcbQ', key_ops: ['encrypt', 'decrypt'], kty: 'oct' });
		});

		it('import a key with correct properties', async () => {
			expect<128>(key.algorithm.length).toBe(128);
			expect<'AES-CBC'>(key.algorithm.name).toBe('AES-CBC');
			expect<true>(key.extractable).toBe(true);
			expect<'secret'>(key.type).toBe('secret');
			expect<2>(key.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(key.usages).toEqual(['encrypt', 'decrypt']);
		});

		it('should encrypt and decrypt data correctly', async () => {
			const plaintext = new TextEncoder().encode('Hello, AES-CBC!');
			const ciphertext = await encrypt(key, plaintext);
			const decrypted = await decrypt(key, ciphertext);
			expect(decrypted).toBe('Hello, AES-CBC!');
		});

		it('should export and re-import the key correctly', async () => {
			const jwk = await exportJwk(key);
			const importedKey = await importKey(jwk);
			expect<128>(importedKey.algorithm.length).toBe(128);
			expect<'AES-CBC'>(importedKey.algorithm.name).toBe('AES-CBC');
			expect<true>(importedKey.extractable).toBe(true);
			expect<'secret'>(importedKey.type).toBe('secret');
			expect<2>(importedKey.usages.length).toBe(2);
			expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(importedKey.usages).toEqual(['encrypt', 'decrypt']);
		});
	});

	it('should throw on unsupported JWK alg', async () => {
		await expect(
			importKey({
				// @ts-expect-error testing invalid alg
				alg: 'A128GCM',
				ext: true,
				k: 'qb8In0Rpa9nwSusvxxDcbQ',
				key_ops: ['encrypt', 'decrypt'],
				kty: 'oct',
			}),
		).rejects.toThrow('Unrecognized algorithm name');

		await expect(
			importKey({
				// @ts-expect-error testing invalid alg
				alg: 'A256CBC',
				ext: true,
				k: '9o1xoHt4OamRJvnaLna-5akUb5L98S_iWYGGaXPZ1Yg',
				key_ops: ['encrypt', 'decrypt'],
				kty: 'oct',
			}),
		).rejects.toThrow('Unrecognized algorithm name');
	});
});
