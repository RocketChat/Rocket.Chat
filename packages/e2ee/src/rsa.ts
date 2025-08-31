export const generateRsaOaepKeyPair = (): Promise<CryptoKeyPair> =>
	crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, [
		'encrypt',
		'decrypt',
	]);

export const importRsaOaepKey = (jwk: JsonWebKey & { kty: 'RSA'; alg: 'RSA-OAEP-256' }): Promise<CryptoKey> =>
	crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['decrypt']);
