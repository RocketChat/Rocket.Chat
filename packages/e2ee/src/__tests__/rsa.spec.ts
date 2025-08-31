import { test, expect } from 'vitest';
import { generateRsaOaepKeyPair, importRsaOaepKey, exportRsaOaepKey, decryptRsaOaep, encryptRsaOaep } from '../rsa';

const encode = (s: string) => new TextEncoder().encode(s);
const decode = (b: ArrayBuffer | Uint8Array) => new TextDecoder().decode(b instanceof Uint8Array ? b : new Uint8Array(b));

test('generate, encrypt with public key, and decrypt with private key', async () => {
	const { rsa } = await generateRsaOaepKeyPair();
	const { publicKey, privateKey } = rsa;

	const plaintext = 'Hello RSA-OAEP';
	const data = encode(plaintext);

	const ciphertext = await encryptRsaOaep(publicKey, data);
	expect(ciphertext).toBeInstanceOf(ArrayBuffer);
	expect(new Uint8Array(ciphertext).byteLength).toBe(256); // 2048-bit modulus

	const decrypted = await decryptRsaOaep(privateKey, new Uint8Array(ciphertext));
	expect(decode(decrypted)).toBe(plaintext);
	expect(new Uint8Array(decrypted).byteLength).toBe(data.byteLength);
}, 20000);

test('export private key to JWK, import back, imported key is non-extractable and usable', async () => {
	const { rsa } = await generateRsaOaepKeyPair();
	const { publicKey, privateKey } = rsa;

	const jwk = await exportRsaOaepKey(privateKey);
	expect(jwk.kty).toBe('RSA');
	expect('d' in jwk).toBe(true);

	const importedPrivate = await importRsaOaepKey(jwk);
	expect(importedPrivate.type).toBe('private');
	expect(importedPrivate.algorithm && (importedPrivate.algorithm as any).name).toBe('RSA-OAEP');

	await expect(exportRsaOaepKey(importedPrivate)).rejects.toBeDefined();

	const msg = 'Roundtrip after import';
	const ct = await encryptRsaOaep(publicKey, encode(msg));
	const pt = await decryptRsaOaep(importedPrivate, new Uint8Array(ct));
	expect(decode(pt)).toBe(msg);
}, 20000);

test('importRsaOaepKey rejects when given a public JWK for decrypt usage', async () => {
	const { rsa } = await generateRsaOaepKeyPair();
	const { publicKey } = rsa;

	const publicJwk = await exportRsaOaepKey(publicKey);
	expect(publicJwk.kty).toBe('RSA');
	expect('d' in publicJwk).toBe(false);

	await expect(importRsaOaepKey(publicJwk)).rejects.toBeDefined();
}, 10000);

test('encrypt with private key rejects; decrypt with public key rejects', async () => {
	const { rsa } = await generateRsaOaepKeyPair();
	const { publicKey, privateKey } = rsa;

	const data = encode('invalid ops');

	await expect(encryptRsaOaep(privateKey, data)).rejects.toBeDefined();

	const ct = await encryptRsaOaep(publicKey, data);
	await expect(decryptRsaOaep(publicKey, new Uint8Array(ct))).rejects.toBeDefined();
}, 15000);

test('tampering with ciphertext causes decryption to fail', async () => {
	const { rsa } = await generateRsaOaepKeyPair();
	const { publicKey, privateKey } = rsa;

	const data = encode('Do not tamper');

	const ctBuf = await encryptRsaOaep(publicKey, data);
	const tampered = new Uint8Array(ctBuf);
	tampered[0]! ^= 0xff;

	await expect(decryptRsaOaep(privateKey, tampered)).rejects.toBeDefined();
}, 15000);
