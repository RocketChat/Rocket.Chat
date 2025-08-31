export const generateRsaOaepKeyPair = async (): Promise<CryptoKeyPair> => {
	const keyPair = await crypto.subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt'],
	);
	return keyPair;
};

export const importRsaOaepKey = async (jwk: JsonWebKey & { kty: 'RSA'; alg: 'RSA-OAEP-256' }): Promise<CryptoKey> => {
	const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['decrypt']);
	return key;
};
