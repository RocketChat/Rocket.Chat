type AesKeyAlgorithmLength = 128 | 256;

interface IAesCbcKeyAlgorithm<TLength extends AesKeyAlgorithmLength> extends AesKeyAlgorithm {
	name: 'AES-CBC';
	length: TLength;
}

interface IAesGcmKeyAlgorithm<TLength extends AesKeyAlgorithmLength> extends AesKeyAlgorithm {
	name: 'AES-GCM';
	length: TLength;
}

export type Key = CryptoKey & {
	algorithm: IAesCbcKeyAlgorithm<128> | IAesGcmKeyAlgorithm<256>;
	extractable: true;
	type: 'secret';
	usages: ['encrypt', 'decrypt'] | ['decrypt', 'encrypt'];
};

type AesEncryptedContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

const JWK_ALG_TO_AES_KEY_ALGORITHM = {
	A256GCM: { name: 'AES-GCM', length: 256 },
	A128CBC: { name: 'AES-CBC', length: 128 },
} satisfies Record<string, Key['algorithm']>;

export const importKey = async (jwk: JsonWebKey): Promise<Key> => {
	if (!('alg' in jwk)) {
		throw new Error('JWK alg property is required to import the key');
	}

	if (jwk.alg !== 'A256GCM' && jwk.alg !== 'A128CBC') {
		throw new Error(`Unsupported JWK alg: ${jwk.alg}`);
	}

	const algorithm = JWK_ALG_TO_AES_KEY_ALGORITHM[jwk.alg];

	const key = await crypto.subtle.importKey('jwk', jwk, algorithm, true, ['encrypt', 'decrypt']);

	return key as Key;
};

export const exportKey = (key: Key): Promise<JsonWebKey> => {
	return crypto.subtle.exportKey('jwk', key);
};

export const generateKey = async (): Promise<Key> => {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

	return key as Key;
};

export const decrypt = async (key: Key, content: AesEncryptedContent): Promise<string> => {
	const decrypted = await crypto.subtle.decrypt(
		{ name: key.algorithm.name, iv: content.iv } satisfies AesGcmParams | AesCbcParams,
		key,
		content.ciphertext,
	);
	return new TextDecoder().decode(decrypted);
};

export const encrypt = async (key: Key, plaintext: Uint8Array<ArrayBuffer>): Promise<AesEncryptedContent> => {
	const ivLength = key.algorithm.name === 'AES-GCM' ? 12 : 16;
	const iv = crypto.getRandomValues(new Uint8Array(ivLength));
	const ciphertext = await crypto.subtle.encrypt({ name: key.algorithm.name, iv }, key, plaintext);
	return { iv, ciphertext: new Uint8Array(ciphertext) };
};
