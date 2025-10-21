type HashAlgorithm = { name: 'SHA-256' };
type ModulusLength = 2048;
type Name = 'RSA-OAEP';

interface IRsaAlgorithm extends RsaHashedKeyAlgorithm {
	readonly name: Name;
	readonly modulusLength: ModulusLength;
	readonly publicExponent: Uint8Array<ArrayBuffer>;
	readonly hash: HashAlgorithm;
}

export interface IKey extends CryptoKey {
	algorithm: IRsaAlgorithm;
}

export interface IPrivateKey extends IKey {
	type: 'private';
	usages: ['decrypt'];
	extractable: true;
}

export interface IPublicKey extends IKey {
	type: 'public';
	usages: ['encrypt'];
	extractable: true;
}

export interface IKeyPair extends CryptoKeyPair {
	publicKey: IPublicKey;
	privateKey: IPrivateKey;
}

export const generateKeyPair = async (): Promise<IKeyPair> => {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		} satisfies IRsaAlgorithm,
		true,
		['encrypt', 'decrypt'],
	);

	return keyPair as IKeyPair;
};

type Base64Url = string;

export interface IPublicJwk {
	kty: 'RSA';
	alg: 'RSA-OAEP-256';
	e: 'AQAB';
	ext: true;
	key_ops: ['encrypt'];
	n: Base64Url;
}

export interface IPrivateJwk {
	kty: 'RSA';
	alg: 'RSA-OAEP-256';
	e: 'AQAB';
	ext: true;
	d: Base64Url;
	dp: Base64Url;
	dq: Base64Url;
	key_ops: ['decrypt'];
	n: Base64Url;
	p: Base64Url;
	q: Base64Url;
	qi: Base64Url;
}

export const exportPublicKey = async (key: IPublicKey): Promise<IPublicJwk> => {
	const jwk = await crypto.subtle.exportKey('jwk', key);
	return jwk as IPublicJwk;
};

export const exportPrivateKey = async (key: IPrivateKey): Promise<IPrivateJwk> => {
	const jwk = await crypto.subtle.exportKey('jwk', key);
	return jwk as IPrivateJwk;
};

export const importPrivateKey = async (keyData: IPrivateJwk): Promise<IPrivateKey> => {
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
	return key as IPrivateKey;
};

export const importPublicKey = async (keyData: IPublicJwk): Promise<IPublicKey> => {
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
	return key as IPublicKey;
};

export const encrypt = async (key: IPublicKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' } satisfies RsaOaepParams, key, data);
	return new Uint8Array(encrypted);
};

export const decrypt = async (key: IPrivateKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' } satisfies RsaOaepParams, key, data);
	return new Uint8Array(decrypted);
};
