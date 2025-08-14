import { BaseKeyCodec } from '@rocket.chat/e2ee';

export class NodeKeyCodec extends BaseKeyCodec {
	constructor() {
		super({
			exportJsonWebKey: (key) => crypto.subtle.exportKey('jwk', key),
			getRandomUint8Array: (array) => crypto.getRandomValues(array),
			getRandomUint16Array: (array) => crypto.getRandomValues(array),
			getRandomUint32Array: (array) => crypto.getRandomValues(array),
			importRawKey: (raw) => crypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey']),
			generateKeyPair: () =>
				crypto.subtle.generateKey(
					{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
					true,
					['encrypt', 'decrypt'],
				),
			decodeBase64: (input) => new Uint8Array(Buffer.from(input, 'base64')),
			encodeBase64: (input) => Buffer.from(input).toString('base64'),
			decryptAesCbc: (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data),
			encryptAesCbc: (key, iv, data) => crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data),
		});
	}
}
