import { IOTRAlgorithm } from '../../../definition/IOTR';
import OTR from './OTR';

export const joinEncryptedData = ({ encryptedData, iv }: { encryptedData: Uint8Array; iv: Uint8Array }): Uint8Array => {
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
}): Promise<Uint8Array> =>
	await OTR.crypto.encrypt(
		{
			name: 'AES-GCM',
			iv,
		},
		_sessionKey,
		data,
	);
export const digest = async (bits: ArrayBuffer): Promise<ArrayBuffer> =>
	await OTR.crypto.digest(
		{
			name: 'SHA-256',
		},
		bits,
	);
export const deriveBits = async ({ ecdhObj, _keyPair }: { ecdhObj: IOTRAlgorithm; _keyPair: CryptoKeyPair }): Promise<ArrayBuffer> =>
	await OTR.crypto.deriveBits(ecdhObj, _keyPair.privateKey, 256);
export const importKey = async (publicKeyObject: JsonWebKey): Promise<CryptoKey> =>
	await OTR.crypto.importKey(
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
	await OTR.crypto.importKey(
		'raw',
		sessionKeyData,
		{
			name: 'AES-GCM',
		},
		false,
		['encrypt', 'decrypt'],
	);
export const exportKey = async (_keyPair: CryptoKey): Promise<JsonWebKey> => await OTR.crypto.exportKey('jwk', _keyPair);
export const generateKeyPair = async (): Promise<CryptoKeyPair> =>
	await OTR.crypto.generateKey(
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
	const data = await OTR.crypto.decrypt(
		{
			name: 'AES-GCM',
			iv,
		},
		_sessionKey,
		cipherText,
	);
	return data;
};
