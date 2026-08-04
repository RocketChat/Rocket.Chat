import { importRaw, getRandomValues, decryptBuffer, encryptBuffer, deriveBits, type IKey } from './shared';

type Algorithms = { name: 'AES-GCM'; length: 256 } | { name: 'AES-CBC'; length: 256 };

export type DerivedKey<TAlgorithm extends Algorithms = Algorithms> = IKey<
	TAlgorithm,
	false,
	'secret',
	TAlgorithm['name'] extends 'AES-CBC' ? ['decrypt'] : ['encrypt', 'decrypt']
>;

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

export type BaseKey = IKey<
	{
		readonly name: 'PBKDF2';
	},
	false,
	'secret',
	['deriveBits']
>;

export const importBaseKey = async (keyData: Uint8Array<ArrayBuffer>): Promise<BaseKey> => {
	const baseKey = await importRaw(keyData, { name: 'PBKDF2' }, false, ['deriveBits']);
	return baseKey;
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

export const derive = async (key: BaseKey, options: Options): Promise<DerivedBits> => {
	const bits = await deriveBits(
		{ name: key.algorithm.name, hash: 'SHA-256', salt: options.salt, iterations: options.iterations },
		key,
		256,
	);
	return bits as DerivedBits;
};

export const importKey = async <T extends Algorithms>(derivedBits: DerivedBits, algorithm: T): Promise<DerivedKey<T>> => {
	const usages: ['decrypt'] | ['encrypt', 'decrypt'] = algorithm.name === 'AES-CBC' ? ['decrypt'] : ['encrypt', 'decrypt'];
	const key = await importRaw(derivedBits, algorithm satisfies AesKeyGenParams, false, usages);
	return key as DerivedKey<T>;
};

export const decrypt = async (key: DerivedKey, content: EncryptedContent): Promise<Uint8Array<ArrayBuffer>> => {
	const decrypted = await decryptBuffer(
		key,
		{ name: key.algorithm.name, iv: content.iv } satisfies AesCbcParams | AesGcmParams,
		content.ciphertext,
	);
	return new Uint8Array(decrypted);
};

export const encrypt = async (
	key: DerivedKey<{ name: 'AES-GCM'; length: 256 }>,
	data: Uint8Array<ArrayBuffer>,
): Promise<EncryptedContent> => {
	// Always use AES-GCM for new data
	const iv = getRandomValues(new Uint8Array(12));
	const ciphertext = await encryptBuffer(key, { name: 'AES-GCM', iv }, data);
	return { iv, ciphertext: new Uint8Array(ciphertext) };
};
