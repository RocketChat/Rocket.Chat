import type { IOTRAlgorithm } from './IOTR';

const { subtle } = global.crypto;

export const joinEncryptedData = ({ encryptedData, iv }: { encryptedData: ArrayBuffer; iv: Uint8Array }): Uint8Array => {
	const cipherText = new Uint8Array(encryptedData);
	const output = new Uint8Array(iv.length + cipherText.length);
	output.set(iv, 0);
	output.set(cipherText, iv.length);
	return output;
};
export const encryptAES = async ({
	iv,
	_sessionKey,
	data,
}: {
	iv: Uint8Array;
	_sessionKey: CryptoKey;
	data: Uint8Array;
}): Promise<ArrayBuffer> =>
	subtle.encrypt(
		{
			name: 'AES-GCM',
			iv,
		},
		_sessionKey,
		data,
	);
export const digest = async (bits: ArrayBuffer): Promise<ArrayBuffer> =>
	subtle.digest(
		{
			name: 'SHA-256',
		},
		bits,
	);
export const deriveBits = async ({ ecdhObj, _keyPair }: { ecdhObj: IOTRAlgorithm; _keyPair: CryptoKeyPair }): Promise<ArrayBuffer> => {
	if (!_keyPair.privateKey) {
		throw new Error('No private key');
	}

	return subtle.deriveBits(ecdhObj, _keyPair.privateKey, 256);
};

export const importKey = async (publicKeyObject: JsonWebKey): Promise<CryptoKey> =>
	subtle.importKey(
		'jwk',
		publicKeyObject,
		{
			name: 'ECDH',
			namedCurve: 'P-256',
		},
		false,
		[],
	);
export const importKeyRaw = async (sessionKeyData: Uint8Array): Promise<CryptoKey> =>
	subtle.importKey(
		'raw',
		sessionKeyData,
		{
			name: 'AES-GCM',
		},
		false,
		['encrypt', 'decrypt'],
	);
export const exportKey = async (_keyPair: CryptoKey): Promise<JsonWebKey> => subtle.exportKey('jwk', _keyPair);
export const generateKeyPair = async (): Promise<CryptoKeyPair> =>
	subtle.generateKey(
		{
			name: 'ECDH',
			namedCurve: 'P-256',
		},
		false,
		['deriveKey', 'deriveBits'],
	);
export const decryptAES = async (cipherText: Uint8Array, _sessionKey: CryptoKey): Promise<ArrayBuffer> => {
	const iv = cipherText.slice(0, 12);
	cipherText = cipherText.slice(12);
	const data = await subtle.decrypt(
		{
			name: 'AES-GCM',
			iv,
		},
		_sessionKey,
		cipherText,
	);
	return data;
};
