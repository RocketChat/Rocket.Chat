import { expect, test } from 'vitest';
import KeyCodec from '../codec.ts';

const codec = new KeyCodec();

test('KeyCodec stringifyUint8Array', () => {
	const data = new Uint8Array([1, 2, 3]);
	const jsonString = codec.stringifyUint8Array(data);
	expect(jsonString).toBe('{"$binary":"AQID"}');
});

test('KeyCodec parseUint8Array', () => {
	const jsonString = '{"$binary":"AQID"}';
	const data = codec.parseUint8Array(jsonString);
	expect(data).toEqual(new Uint8Array([1, 2, 3]));
});

test('KeyCodec roundtrip (v1 structured encoding)', async () => {
	const { privateJWK } = await codec.generateRsaOaepKeyPair();

	const saltBuffer = codec.encodeSalt('salt-user-1');
	const masterKey = await codec.deriveMasterKey(saltBuffer, 'pass123');
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	const dec = await codec.decodePrivateKey(enc, masterKey);
	expect(dec).toStrictEqual(privateJWK);
});

test('KeyCodec wrong password fails', async () => {
	const { privateJWK } = await codec.generateRsaOaepKeyPair();
	const salt1 = codec.encodeSalt('salt1');
	const masterKey = await codec.deriveMasterKey(salt1, 'correct');
	const masterKey2 = await codec.deriveMasterKey(salt1, 'incorrect');
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	await expect(codec.decodePrivateKey(enc, masterKey2)).rejects.toThrow();
});

test('KeyCodec tamper detection (ciphertext)', async () => {
	const { privateJWK } = await codec.generateRsaOaepKeyPair();
	const salt = codec.encodeSalt('salt');
	const masterKey = await codec.deriveMasterKey(salt, 'pw');
	const enc = await codec.encodePrivateKey(privateJWK, masterKey);
	// Tamper with ctB64
	const mutated = { ...enc, ctB64: enc.ctB64.slice(0, -2) + 'AA' };
	await expect(codec.decodePrivateKey(mutated, masterKey)).rejects.toThrow();
});

test('KeyCodec legacy roundtrip', async () => {
	const { privateJWK } = await codec.generateRsaOaepKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const blob = await codec.legacyEncrypt(privStr, 'pw', 'salt');
	const decAny = await codec.legacyDecrypt(blob, 'pw', 'salt');
	const dec = typeof decAny === 'string' ? (JSON.parse(decAny) as JsonWebKey) : decAny;
	expect(dec).toStrictEqual(privateJWK);
});
