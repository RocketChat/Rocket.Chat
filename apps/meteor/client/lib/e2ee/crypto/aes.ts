import { subtle, getRandomValues, generateKey, type IKey } from './shared';

type AesKeyAlgorithmLength = 128 | 256;

interface IAesCbcKeyAlgorithm<TLength extends AesKeyAlgorithmLength> extends AesKeyAlgorithm {
	name: 'AES-CBC';
	length: TLength;
}

interface IAesGcmKeyAlgorithm<TLength extends AesKeyAlgorithmLength> extends AesKeyAlgorithm {
	name: 'AES-GCM';
	length: TLength;
}

type SupportedAesKeyAlgorithm = IAesCbcKeyAlgorithm<128> | IAesGcmKeyAlgorithm<256>;

type JwkAlg = 'A128CBC' | 'A256GCM';
export type Jwk<TAlg extends JwkAlg = JwkAlg> = {
	kty: 'oct';
	k: string;
	key_ops: ['encrypt', 'decrypt'] | ['decrypt', 'encrypt'];
	ext: true;
	alg: TAlg;
};

export type Key<TAlgorithm extends SupportedAesKeyAlgorithm = SupportedAesKeyAlgorithm> = CryptoKey & {
	algorithm: TAlgorithm;
	extractable: true;
	type: 'secret';
	usages: ['encrypt', 'decrypt'] | ['decrypt', 'encrypt'];
};

type AesEncryptedContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

type ToJwkAlg<TAlgorithm extends SupportedAesKeyAlgorithm> =
	TAlgorithm extends IAesGcmKeyAlgorithm<256> ? 'A256GCM' : TAlgorithm extends IAesCbcKeyAlgorithm<128> ? 'A128CBC' : never;

const JWK_ALG_TO_AES_KEY_ALGORITHM = {
	A256GCM: { name: 'AES-GCM', length: 256 },
	A128CBC: { name: 'AES-CBC', length: 128 },
} satisfies Record<JwkAlg, SupportedAesKeyAlgorithm>;

export const importKey = async <const TJwk extends Jwk>(jwk: TJwk): Promise<Key<(typeof JWK_ALG_TO_AES_KEY_ALGORITHM)[TJwk['alg']]>> => {
	if (!('alg' in jwk)) {
		throw new Error('JWK alg property is required to import the key');
	}

	if (jwk.alg !== 'A256GCM' && jwk.alg !== 'A128CBC') {
		throw new Error(`Unsupported JWK alg: ${jwk.alg}`);
	}

	const algorithm = JWK_ALG_TO_AES_KEY_ALGORITHM[jwk.alg];

	const key = await subtle.importKey('jwk', jwk, algorithm, true, ['encrypt', 'decrypt']);

	return key as Key<(typeof JWK_ALG_TO_AES_KEY_ALGORITHM)[TJwk['alg']]>;
};

export const exportKey = async <TAlgorithm extends SupportedAesKeyAlgorithm>(key: Key<TAlgorithm>): Promise<Jwk<ToJwkAlg<TAlgorithm>>> => {
	const jwk = await subtle.exportKey('jwk', key);
	return jwk as Jwk<ToJwkAlg<TAlgorithm>>;
};

export const generate = async (): Promise<IKey<{ name: 'AES-GCM'; length: 256 }, true, 'secret', ['encrypt', 'decrypt']>> => {
	const key = await generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	return key;
};

export const decrypt = async (key: Key, content: AesEncryptedContent): Promise<string> => {
	const decrypted = await subtle.decrypt(
		{ name: key.algorithm.name, iv: content.iv } satisfies AesGcmParams | AesCbcParams,
		key,
		content.ciphertext,
	);
	return new TextDecoder().decode(decrypted);
};

export const encrypt = async (key: Key, plaintext: Uint8Array<ArrayBuffer>): Promise<AesEncryptedContent> => {
	const ivLength = key.algorithm.name === 'AES-GCM' ? 12 : 16;
	const iv = getRandomValues(new Uint8Array(ivLength));
	const ciphertext = await subtle.encrypt({ name: key.algorithm.name, iv }, key, plaintext);
	return { iv, ciphertext: new Uint8Array(ciphertext) };
};
