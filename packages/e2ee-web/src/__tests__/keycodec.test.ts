import { test, expect } from 'vitest';
import { WebKeyCodec } from '../keyCodec.ts';

const createKeyCodec = () => new WebKeyCodec();

test('KeyCodec roundtrip (v1 structured encoding)', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const masterKey = await codec.deriveMasterKey('pass123', new TextEncoder().encode('salt-user-1'));
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	const dec = await codec.decodePrivateKey(enc, masterKey);
	expect(dec).toBe(privateJWK);
});

test('KeyCodec wrong password fails', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const salt1 = new TextEncoder().encode('salt1');
	const masterKey = await codec.deriveMasterKey('correct', salt1);
	const masterKey2 = await codec.deriveMasterKey('incorrect', salt1);
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	await expect(codec.decodePrivateKey(enc, masterKey2)).rejects.toThrow();
});

test('KeyCodec tamper detection (ciphertext)', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	// const privStr = JSON.stringify(privateJWK);
	const masterKey = await codec.deriveMasterKey('pw', new TextEncoder().encode('salt'));
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	// Tamper with ctB64
	const mutated = { ...enc, ctB64: enc.ctB64.slice(0, -2) + 'AA' };
	await expect(codec.decodePrivateKey(mutated, masterKey)).rejects.toThrow();
});

test('KeyCodec legacy roundtrip', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const blob = await codec.legacyEncrypt(privStr, 'pw', 'salt');
	const dec = await codec.legacyDecrypt(blob, 'pw', 'salt');
	expect(dec).toBe(privateJWK);
});
