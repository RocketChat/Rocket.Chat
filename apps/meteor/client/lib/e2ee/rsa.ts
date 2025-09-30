export type Key = CryptoKey & { algorithm: RsaKeyAlgorithm };
export type PrivateKey = Key & { type: 'private'; usages: ['decrypt'] };
export type PublicKey = Key & { type: 'public'; usages: ['encrypt'] };
export type KeyPair = CryptoKeyPair & { publicKey: PublicKey; privateKey: PrivateKey };

export const generateKeyPair = async (): Promise<KeyPair> => {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		} satisfies RsaHashedKeyGenParams,
		true,
		['encrypt', 'decrypt'],
	);

	return keyPair as KeyPair;
};

export const exportKey = (key: Key): Promise<JsonWebKey> => {
	return crypto.subtle.exportKey('jwk', key);
};

export const importPrivateKey = async (keyData: JsonWebKey): Promise<PrivateKey> => {
	const key = await crypto.subtle.importKey(
		'jwk',
		keyData,
		{
			name: 'RSA-OAEP',
			hash: { name: 'SHA-256' },
		},
		true,
		['decrypt'],
	);
	return key as PrivateKey;
};

export const importPublicKey = async (keyData: JsonWebKey): Promise<PublicKey> => {
	const key = await crypto.subtle.importKey(
		'jwk',
		keyData,
		{
			name: 'RSA-OAEP',
			hash: { name: 'SHA-256' },
		},
		true,
		['encrypt'],
	);
	return key as PublicKey;
};

export const encrypt = async (key: PublicKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' } satisfies RsaOaepParams, key, data);
	return new Uint8Array(encrypted);
};

export const decrypt = async (key: PrivateKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' } satisfies RsaOaepParams, key, data);
	return new Uint8Array(decrypted);
};
