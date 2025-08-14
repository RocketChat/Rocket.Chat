import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { KeyCodec } from '@rocket.chat/e2ee';

const createKeyCodec = () =>
	new KeyCodec({
		exportJsonWebKey: (key) => webcrypto.subtle.exportKey('jwk', key),
		getRandomValues: (array) => crypto.getRandomValues(array),
		importRawKey: (raw) => webcrypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey']),
		generateKeyPair: () =>
			webcrypto.subtle.generateKey(
				{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
				true,
				['encrypt', 'decrypt'],
			),
		decodeBase64: (input) => new Uint8Array(Buffer.from(input, 'base64')),
		encodeBase64: (input) => Buffer.from(input).toString('base64'),
		decryptAesCbc: (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data),
		encryptAesCbc: (key, iv, data) => webcrypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data),
	});

test('KeyCodec roundtrip (v1 structured encoding)', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const masterKey = await codec.deriveMasterKey('pass123', new TextEncoder().encode('salt-user-1'));
	const enc = await codec.encodePrivateKey(privStr, masterKey);
	const dec = await codec.decodePrivateKey(enc, masterKey);
	assert.equal(dec, privStr);
});

test('KeyCodec wrong password fails', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const salt1 = new TextEncoder().encode('salt1');
	const masterKey = await codec.deriveMasterKey('correct', salt1);
	const masterKey2 = await codec.deriveMasterKey('incorrect', salt1);
	const enc = await codec.encodePrivateKey(privStr, masterKey);
	await assert.rejects(() => codec.decodePrivateKey(enc, masterKey2));
});

test('KeyCodec tamper detection (ciphertext)', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const masterKey = await codec.deriveMasterKey('pw', new TextEncoder().encode('salt'));
	const enc = await codec.encodePrivateKey(privStr, masterKey);
	// Tamper with ctB64
	const mutated = { ...enc, ctB64: enc.ctB64.slice(0, -2) + 'AA' };
	await assert.rejects(() => codec.decodePrivateKey(mutated, masterKey));
});

test('KeyCodec legacy roundtrip', async () => {
	const codec = createKeyCodec();
	const { privateJWK } = await codec.generateRSAKeyPair();
	const privStr = JSON.stringify(privateJWK);
	const blob = await codec.legacyEncrypt(privStr, 'pw', 'salt');
	const dec = await codec.legacyDecrypt(blob, 'pw', 'salt');
	assert.equal(dec, privStr);
});
