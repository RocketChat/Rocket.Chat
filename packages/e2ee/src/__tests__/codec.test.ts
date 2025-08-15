// import { BaseKeyCodec, type CryptoProvider } from '../key-codec.ts';

// class KeyCodec extends BaseKeyCodec {
// 	constructor() {
// 		super({
// 			decodeBase64: (input) => {
// 				const binaryString = atob(data)
// 			}
// 		});
// 	}
// }

// test('KeyCodec roundtrip (v1 structured encoding)', async () => {
// 	const codec = new KeyCodec(testCrypto);
// 	const { privateJWK } = await codec.generateRSAKeyPair();
// 	const privStr = JSON.stringify(privateJWK);
// 	const masterKey = await codec.deriveMasterKey('pass123', new TextEncoder().encode('salt-user-1'));
// 	const enc = await codec.encodePrivateKey(privStr, masterKey);
// 	const dec = await codec.decodePrivateKey(enc, masterKey);
// 	assert.equal(dec, privStr);
// });

// test('KeyCodec wrong password fails', async () => {
// 	const codec = new KeyCodec(deps);
// 	const { privateJWK } = await codec.generateRSAKeyPair();
// 	const privStr = JSON.stringify(privateJWK);
// 	const salt1 = new TextEncoder().encode('salt1');
// 	const masterKey = await codec.deriveMasterKey('correct', salt1);
// 	const masterKey2 = await codec.deriveMasterKey('incorrect', salt1);
// 	const enc = await codec.encodePrivateKey(privStr, masterKey);
// 	await assert.rejects(() => codec.decodePrivateKey(enc, masterKey2));
// });

// test('KeyCodec tamper detection (ciphertext)', async () => {
// 	const codec = new KeyCodec(deps);
// 	const { privateJWK } = await codec.generateRSAKeyPair();
// 	const privStr = JSON.stringify(privateJWK);
// 	const masterKey = await codec.deriveMasterKey('pw', new TextEncoder().encode('salt'));
// 	const enc = await codec.encodePrivateKey(privStr, masterKey);
// 	// Tamper with ctB64
// 	const mutated = { ...enc, ctB64: enc.ctB64.slice(0, -2) + 'AA' };
// 	await assert.rejects(() => codec.decodePrivateKey(mutated, masterKey));
// });

// test('KeyCodec legacy roundtrip', async () => {
// 	const codec = new KeyCodec(deps);
// 	const { privateJWK } = await codec.generateRSAKeyPair();
// 	const privStr = JSON.stringify(privateJWK);
// 	const blob = await codec.legacyEncrypt(privStr, 'pw', 'salt');
// 	const dec = await codec.legacyDecrypt(blob, 'pw', 'salt');
// 	assert.equal(dec, privStr);
// });
export {};
