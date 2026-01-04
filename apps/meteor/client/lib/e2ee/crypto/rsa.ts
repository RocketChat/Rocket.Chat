import { generateKeyPair, exportKey, importJwk, type IKeyPair, encryptBuffer, decryptBuffer } from './shared';

export type KeyPair = IKeyPair<
	{
		readonly name: 'RSA-OAEP';
		readonly modulusLength: 2048;
		readonly publicExponent: Uint8Array<ArrayBuffer>;
		readonly hash: {
			readonly name: 'SHA-256';
		};
	},
	true,
	['encrypt', 'decrypt']
>;

export type PublicKey = KeyPair['publicKey'];

export type PrivateKey = KeyPair['privateKey'];

export const generate = async (): Promise<KeyPair> => {
	const keyPair = await generateKeyPair(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		},
		true,
		['encrypt', 'decrypt'],
	);

	return keyPair;
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

export const exportPublicKey = async (key: PublicKey): Promise<IPublicJwk> => {
	const jwk = await exportKey('jwk', key);
	return jwk as IPublicJwk;
};

export const exportPrivateKey = async (key: PrivateKey): Promise<IPrivateJwk> => {
	const jwk = await exportKey('jwk', key);
	return jwk as IPrivateJwk;
};

export const importPrivateKey = async (keyData: IPrivateJwk): Promise<PrivateKey> => {
	const key = await importJwk(
		keyData,
		{
			name: 'RSA-OAEP',
			hash: { name: 'SHA-256' },
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
		},
		true,
		['decrypt'],
	);
	return key as PrivateKey;
};

export const importPublicKey = async (keyData: IPublicJwk): Promise<PublicKey> => {
	const key = await importJwk(
		keyData,
		{
			name: 'RSA-OAEP',
			hash: { name: 'SHA-256' },
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
		},
		true,
		['encrypt'],
	);
	return key as PublicKey;
};

export const encrypt = async (key: PublicKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const encrypted = await encryptBuffer(key, { name: key.algorithm.name }, data);
	return new Uint8Array(encrypted);
};

export const decrypt = async (key: PrivateKey, data: BufferSource): Promise<Uint8Array<ArrayBuffer>> => {
	const decrypted = await decryptBuffer(key, { name: key.algorithm.name }, data);
	return new Uint8Array(decrypted);
};
