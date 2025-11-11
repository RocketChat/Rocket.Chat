import { generate, decrypt, encrypt, exportPublicKey, exportPrivateKey, importPrivateKey, importPublicKey, type KeyPair } from './rsa';

describe('rsa', () => {
	let keyPair: KeyPair;

	beforeAll(async () => {
		keyPair = await generate();
	});

	it('generate a key pair with correct properties', async () => {
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

	it('should encrypt and decrypt data correctly', async () => {
		const plaintext = new TextEncoder().encode('Hello, RSA-OAEP!');
		const ciphertext = await encrypt(keyPair.publicKey, plaintext);
		const decrypted = await decrypt(keyPair.privateKey, ciphertext);
		expect(new TextDecoder().decode(decrypted)).toBe('Hello, RSA-OAEP!');
	});

	it('should export and re-import the keys correctly', async () => {
		const publicJwk = await exportPublicKey(keyPair.publicKey);
		const privateJwk = await exportPrivateKey(keyPair.privateKey);

		expect<'RSA-OAEP-256'>(publicJwk.alg).toBe('RSA-OAEP-256');
		expect<'RSA'>(publicJwk.kty).toBe('RSA');
		expect<true>(publicJwk.ext).toBe(true);
		expect<'AQAB'>(publicJwk.e).toBe('AQAB');

		expect<'RSA-OAEP-256'>(privateJwk.alg).toBe('RSA-OAEP-256');
		expect<'RSA'>(privateJwk.kty).toBe('RSA');
		expect<true>(privateJwk.ext).toBe(true);
		expect<'AQAB'>(privateJwk.e).toBe('AQAB');

		expect(privateJwk.n).toEqual(publicJwk.n);

		const importedPublicKey = await importPublicKey(publicJwk);
		expect<2048>(importedPublicKey.algorithm.modulusLength).toBe(2048);
		expect<'RSA-OAEP'>(importedPublicKey.algorithm.name).toBe('RSA-OAEP');
		expect<true>(importedPublicKey.extractable).toBe(true);
		expect<'public'>(importedPublicKey.type).toBe('public');
		expect<1>(importedPublicKey.usages.length).toBe(1);
		expect<['encrypt']>(importedPublicKey.usages).toEqual(['encrypt']);

		const importedPrivateKey = await importPrivateKey(privateJwk);
		expect<2048>(importedPrivateKey.algorithm.modulusLength).toBe(2048);
		expect<'RSA-OAEP'>(importedPrivateKey.algorithm.name).toBe('RSA-OAEP');
		expect<true>(importedPrivateKey.extractable).toBe(true);
		expect<'private'>(importedPrivateKey.type).toBe('private');
		expect<1>(importedPrivateKey.usages.length).toBe(1);
		expect<['decrypt']>(importedPrivateKey.usages).toEqual(['decrypt']);
	});
});
