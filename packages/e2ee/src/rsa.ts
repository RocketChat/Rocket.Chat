export interface RsaKeyPair {
	rsa: CryptoKeyPair;
}

export const generateRsaOaepKeyPair = async (): Promise<RsaKeyPair> => {
	const keyPair = await crypto.subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt'],
	);
	return { rsa: keyPair };
};

export const importRsaOaepKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
	const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['decrypt']);
	return key;
};

export const exportRsaOaepKey = async (key: CryptoKey): Promise<JsonWebKey> => {
	const jwk = await crypto.subtle.exportKey('jwk', key);
	return jwk;
};

export const decryptRsaOaep = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> => {
	const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);
	return decrypted;
};

export const encryptRsaOaep = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> => {
	const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
	return encrypted;
};
