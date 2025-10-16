export type Options = {
	salt: Uint8Array<ArrayBuffer>;
	iterations: number;
};

export type EncryptedContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

type Narrow<T, U extends { [P in keyof T]?: T[P] }> = {
	[P in keyof T]: P extends keyof U ? U[P] : T[P];
};

export type BaseKey = Narrow<
	CryptoKey,
	{ algorithm: Narrow<KeyAlgorithm, { name: 'PBKDF2' }>; extractable: false; type: 'secret'; usages: ['deriveBits'] }
>;

export const importBaseKey = async (keyData: Uint8Array<ArrayBuffer>): Promise<BaseKey> => {
	const baseKey = await crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, ['deriveBits']);
	return baseKey as BaseKey;
};

type Throws<F> = F extends (...args: infer TArgs) => infer TRet ? (...args: TArgs) => TRet & never : never;

type FixedSizeArrayBuffer<N extends number> = Narrow<
	ArrayBuffer,
	{
		resize: Throws<ArrayBuffer['resize']>;
		readonly byteLength: N;
		get maxByteLength(): N;
		get resizable(): false;
		get detached(): false;
	}
>;

export type DerivedBits = FixedSizeArrayBuffer<32>;

export const deriveBits = async (key: BaseKey, options: Options): Promise<DerivedBits> => {
	const bits = await crypto.subtle.deriveBits(
		{ name: key.algorithm.name, hash: 'SHA-256', salt: options.salt, iterations: options.iterations },
		key,
		256,
	);
	return bits as DerivedBits;
};

export type DerivedKeyAlgorithmName = 'AES-CBC' | 'AES-GCM';

export type DerivedKey<T extends DerivedKeyAlgorithmName = DerivedKeyAlgorithmName> = Narrow<
	CryptoKey,
	{
		readonly algorithm: Narrow<AesKeyAlgorithm, { length: 256; name: T }>;
		readonly extractable: false;
		readonly type: 'secret';
		readonly usages: T extends 'AES-CBC' ? ['decrypt'] : ['encrypt', 'decrypt'];
	}
>;

export const importKey = async <T extends DerivedKeyAlgorithmName>(derivedBits: DerivedBits, algorithm: T): Promise<DerivedKey<T>> => {
	const usages: ['decrypt'] | ['encrypt', 'decrypt'] = algorithm === 'AES-CBC' ? ['decrypt'] : ['encrypt', 'decrypt'];
	const key = await crypto.subtle.importKey('raw', derivedBits, { name: algorithm, length: 256 } satisfies AesKeyGenParams, false, usages);
	return key as DerivedKey<T>;
};

export const decrypt = async (key: DerivedKey, content: EncryptedContent): Promise<Uint8Array<ArrayBuffer>> => {
	const decrypted = await crypto.subtle.decrypt(
		{ name: key.algorithm.name, iv: content.iv } satisfies AesCbcParams | AesGcmParams,
		key,
		content.ciphertext,
	);
	return new Uint8Array(decrypted);
};

export const encrypt = async (key: DerivedKey, data: Uint8Array<ArrayBuffer>): Promise<EncryptedContent> => {
	// Always use AES-GCM for new data
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv } satisfies AesGcmParams, key, data);
	return { iv, ciphertext: new Uint8Array(ciphertext) };
};
