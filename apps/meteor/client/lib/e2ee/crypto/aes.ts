import { importJwk, exportKey, getRandomValues, generateKey, type IKey, type Exported, encryptBuffer, decryptBuffer } from './shared';

type AlgorithmMap = {
	A256GCM: { name: 'AES-GCM'; length: 256 };
	A128CBC: { name: 'AES-CBC'; length: 128 };
};

const ALGORITHM_MAP: AlgorithmMap = {
	A256GCM: { name: 'AES-GCM', length: 256 },
	A128CBC: { name: 'AES-CBC', length: 128 },
};

type Jwa = keyof AlgorithmMap;
type Algorithms = AlgorithmMap[Jwa];

export type Key<TAlgorithm extends Algorithms = Algorithms, TExtractable extends CryptoKey['extractable'] = true> = IKey<
	TAlgorithm,
	TExtractable,
	'secret',
	['encrypt', 'decrypt']
>;

export type Jwk<TJwa extends Jwa = Jwa> = {
	kty: 'oct';
	k: string;
	key_ops: ['encrypt', 'decrypt'] | ['decrypt', 'encrypt'];
	ext: true;
	alg: TJwa;
};

type AesEncryptedContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

export const importKey = <const TJwa extends Jwa>(jwk: Jwk<TJwa>): Promise<Key<AlgorithmMap[(typeof jwk)['alg']]>> => {
	return importJwk(jwk, ALGORITHM_MAP[jwk.alg], true, ['encrypt', 'decrypt']);
};

export const exportJwk = <TAlgorithm extends Algorithms>(key: Key<TAlgorithm>): Promise<Exported<'jwk', Key<TAlgorithm>>> => {
	return exportKey('jwk', key);
};

export const generate = (): Promise<Key<{ name: 'AES-GCM'; length: 256 }>> => {
	return generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
};

export const decrypt = async (key: Key, content: AesEncryptedContent): Promise<string> => {
	const decrypted = await decryptBuffer(
		key,
		{ name: key.algorithm.name, iv: content.iv } satisfies AesGcmParams | AesCbcParams,
		content.ciphertext,
	);
	return new TextDecoder().decode(decrypted);
};

export const encrypt = async (key: Key, plaintext: Uint8Array<ArrayBuffer>): Promise<AesEncryptedContent> => {
	const ivLength = key.algorithm.name === 'AES-GCM' ? 12 : 16;
	const iv = getRandomValues(new Uint8Array(ivLength));
	const ciphertext = await encryptBuffer(key, { name: key.algorithm.name, iv }, plaintext);
	return { iv, ciphertext: new Uint8Array(ciphertext) };
};
