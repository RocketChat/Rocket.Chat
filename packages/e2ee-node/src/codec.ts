import { BaseKeyCodec } from '@rocket.chat/e2ee';

export default class NodeKeyCodec extends BaseKeyCodec {
	constructor() {
		super({
			exportJsonWebKey: (key) => crypto.subtle.exportKey('jwk', key),
			getRandomUint8Array: (array) => crypto.getRandomValues(array),
			getRandomUint16Array: (array) => crypto.getRandomValues(array),
			getRandomUint32Array: (array) => crypto.getRandomValues(array),
			importRawKey: (raw) => crypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey']),
			importRsaDecryptKey: (key) => crypto.subtle.importKey('jwk', key, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']),
			generateKeyPair: () =>
				crypto.subtle.generateKey(
					{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
					true,
					['encrypt', 'decrypt'],
				),
			decodeBase64: (input) => Buffer.from(input, 'base64'),
			encodeBase64: (bytes) => Buffer.from(bytes).toString('base64'),
			decryptAesCbc: (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data),
			encryptAesCbc: (key, iv, data) => crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data),
			encodeUtf8: (input) => {
				const encoder = new TextEncoder();
				const dest = new Uint8Array(input.length);
				encoder.encodeInto(input, dest);
				return dest;
			},
			decodeUtf8: (input) => new TextDecoder().decode(input),
			deriveKeyWithPbkdf2: (salt, baseKey) => {
				// The BaseKeyCodec expects an AES-CBC key with 256-bit length and ITERATIONS = 1000 for
				// encode/decode operations. Previous implementation derived an AES-GCM key with 100000 iterations,
				// which caused InvalidAccessError when using the key for AES-CBC encryption in tests.
				return crypto.subtle.deriveKey(
					{
						name: 'PBKDF2',
						salt,
						iterations: 1000,
						hash: 'SHA-256',
					},
					baseKey,
					{
						name: 'AES-CBC',
						length: 256,
					},
					false,
					['encrypt', 'decrypt'],
				);
			},
			encodeBinary: (input) => {
				const encoder = new TextEncoder();
				const dest = new Uint8Array(input.length);
				encoder.encodeInto(input, dest);
				return dest;
			},
		});
	}
}
