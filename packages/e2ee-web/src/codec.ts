import { BaseKeyCodec } from '@rocket.chat/e2ee';

export default class WebKeyCodec extends BaseKeyCodec {
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
			decodeBase64: (input) => {
				const binaryString = atob(input);
				const len = binaryString.length;
				const bytes = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				return bytes;
			},
			encodeBase64: (input) => {
				const bytes = new Uint8Array(input);
				let binaryString = '';
				for (let i = 0; i < bytes.byteLength; i++) {
					binaryString += String.fromCharCode(bytes[i]!);
				}
				return btoa(binaryString);
			},
			decryptAesCbc: (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data),
			encryptAesCbc: (key, iv, data) => crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data),
			encodeUtf8: (input) => new TextEncoder().encode(input),
			decodeUtf8: (input) => new TextDecoder().decode(input),
			deriveKeyWithPbkdf2: (salt, baseKey) => {
				// Align with BaseKeyCodec expectations: derive an AES-CBC 256-bit key with 1000 iterations (legacy compatibility)
				// Previous version derived AES-GCM with 100000 iterations, causing algorithm mismatch errors in tests.
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
		});
	}
}
