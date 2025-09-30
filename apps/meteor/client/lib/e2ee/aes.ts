type AesKey = CryptoKey & { algorithm: AesKeyAlgorithm };

type AesEncryptedContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

const JWK_ALG_TO_AES_KEY_ALGORITHM: Record<string, AesKeyAlgorithm> = {
	A256GCM: { name: 'AES-GCM', length: 256 },
	A128CBC: { name: 'AES-CBC', length: 128 },
};

export const importKey = async (jwk: JsonWebKey): Promise<AesKey> => {
	if (!('alg' in jwk) || jwk.alg === undefined) {
		throw new Error('JWK alg property is required to import the key');
	}

	const algorithm = JWK_ALG_TO_AES_KEY_ALGORITHM[jwk.alg];

	if (!algorithm) {
		throw new Error(`Unsupported JWK alg: ${jwk.alg}`);
	}

	const key = await crypto.subtle.importKey('jwk', jwk, algorithm, true, ['encrypt', 'decrypt']);
	return key as AesKey;
};

export const decrypt = async (content: AesEncryptedContent, key: AesKey): Promise<string> => {
	const decrypted = await crypto.subtle.decrypt(
		{ name: key.algorithm.name, iv: content.iv } satisfies AesGcmParams | AesCbcParams,
		key,
		content.ciphertext,
	);
	return new TextDecoder().decode(decrypted);
};
