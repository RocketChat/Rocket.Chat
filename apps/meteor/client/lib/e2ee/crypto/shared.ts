const crypto: Crypto = (() => {
	if (typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto) {
		return globalThis.crypto as Crypto;
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
	const { webcrypto } = require('node:crypto') as typeof import('node:crypto');
	return webcrypto as Crypto;
})();

export const { subtle } = crypto;
export const randomUUID = crypto.randomUUID.bind(crypto);
export const getRandomValues = crypto.getRandomValues.bind(crypto);

type AesParams = {
	name: 'AES-CBC' | 'AES-GCM' | 'AES-CTR';
	length: 128 | 256;
};

type ModeOf<T extends `AES-${'CBC' | 'GCM' | 'CTR'}`> = T extends `AES-${infer Mode}` ? Mode : never;

type Permutations<T> = T extends [infer First]
	? [First]
	: T extends [infer First, infer Second]
		? [First, Second] | [Second, First]
		: never;

export interface IKey<
	TAlgorithm extends CryptoKey['algorithm'] = CryptoKey['algorithm'],
	TExtractable extends CryptoKey['extractable'] = CryptoKey['extractable'],
	TType extends CryptoKey['type'] = CryptoKey['type'],
	TUsages extends CryptoKey['usages'] = CryptoKey['usages'],
> extends CryptoKey {
	readonly algorithm: TAlgorithm;
	readonly extractable: TExtractable;
	readonly type: TType;
	readonly usages: Permutations<TUsages>;
}

export async function generateKey<
	const T extends AesParams,
	const TExtractable extends boolean = boolean,
	const TUsages extends KeyUsage[] = KeyUsage[],
>(algorithm: T, extractable: TExtractable, keyUsages: TUsages): Promise<IKey<T, TExtractable, 'secret', TUsages>> {
	const key = await subtle.generateKey(algorithm, extractable, keyUsages);
	return key as IKey<T, TExtractable, 'secret', TUsages>;
}

type Filter<TItem extends KeyUsage, TArray extends KeyUsage[], Out extends KeyUsage[] = []> = TArray extends [
	infer First extends KeyUsage,
	...infer Rest extends KeyUsage[],
]
	? First extends TItem
		? Filter<TItem, Rest, [...Out, First]>
		: Filter<TItem, Rest, Out>
	: Out;

export interface IKeyPair<
	T extends KeyAlgorithm = KeyAlgorithm,
	TExtractable extends boolean = boolean,
	TUsages extends KeyUsage[] = KeyUsage[],
> extends CryptoKeyPair {
	publicKey: IKey<T, TExtractable, 'public', Filter<'encrypt', TUsages>>;
	privateKey: IKey<T, TExtractable, 'private', Filter<'decrypt', TUsages>>;
}

type RsaParams = {
	name: 'RSA-OAEP';
	modulusLength: 2048;
	publicExponent: Uint8Array<ArrayBuffer>;
	hash: { name: 'SHA-256' };
};

export async function generateKeyPair<
	const T extends RsaParams,
	const TExtractable extends boolean = boolean,
	const TUsages extends KeyUsage[] = KeyUsage[],
>(algorithm: T, extractable: TExtractable, keyUsages: TUsages): Promise<IKeyPair<T, TExtractable, TUsages>> {
	const keyPair = await subtle.generateKey(algorithm, extractable, keyUsages);
	return keyPair as IKeyPair<T, TExtractable, TUsages>;
}

type KeyToJwk<T extends IKey> = T['extractable'] extends false
	? never
	: T['algorithm'] extends AesParams
		? {
				kty: 'oct';
				alg: `A${T['algorithm']['length']}${ModeOf<T['algorithm']['name']>}`;
				ext: true;
				k: string;
				key_ops: T['usages'];
			}
		: [T['algorithm'], T['type']] extends [RsaParams, 'public']
			? {
					kty: 'RSA';
					alg: 'RSA-OAEP-256';
					e: string;
					ext: true;
					key_ops: T['usages'];
					n: string;
				}
			: [T['algorithm'], T['type']] extends [RsaParams, 'private']
				? {
						kty: 'RSA';
						alg: 'RSA-OAEP-256';
						e: string;
						ext: true;
						d: string;
						dp: string;
						dq: string;
						key_ops: T['usages'];
						n: string;
						p: string;
						q: string;
						qi: string;
					}
				: never;

type KeyExportType<TFormat extends KeyFormat, TKey extends IKey = IKey> = TFormat extends 'jwk' ? KeyToJwk<TKey> : ArrayBuffer;

export async function exportKey<const TFormat extends KeyFormat = KeyFormat, const TKey extends IKey = IKey>(
	format: TFormat,
	key: TKey,
): Promise<KeyExportType<TFormat, TKey>> {
	const exportedKey = await subtle.exportKey(format, key);
	return exportedKey as KeyExportType<TFormat>;
}

export async function importKey<
	const TFormat extends KeyFormat = KeyFormat,
	const TKeyData extends TFormat extends 'jwk' ? JsonWebKey : ArrayBuffer = TFormat extends 'jwk' ? JsonWebKey : ArrayBuffer,
	const TAlgorithm extends KeyAlgorithm = KeyAlgorithm,
	const TExtractable extends boolean = boolean,
	const TUsages extends KeyUsage[] = KeyUsage[],
	const TKeyType extends KeyType = TKeyData extends { kty: 'oct' }
		? 'secret'
		: TKeyData extends { kty: 'RSA'; key_ops: [infer Op] }
			? Op extends 'encrypt'
				? 'public'
				: 'private'
			: never,
>(
	format: TFormat,
	keyData: TKeyData,
	algorithm: TAlgorithm,
	extractable: TExtractable,
	keyUsages: TUsages,
): Promise<IKey<TAlgorithm, TExtractable, TKeyType, TUsages>> {
	const key = await subtle.importKey(format as any, keyData as any, algorithm, extractable, keyUsages);
	return key as IKey<TAlgorithm, TExtractable, TKeyType, TUsages>;
}
