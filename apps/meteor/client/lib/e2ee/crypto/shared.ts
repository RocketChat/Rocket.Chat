const { subtle } = crypto;
export const randomUUID = crypto.randomUUID.bind(crypto);
export const getRandomValues = crypto.getRandomValues.bind(crypto);

interface IAesGcmParams extends AesGcmParams {
	name: 'AES-GCM';
}

interface IAesCbcParams extends AesCbcParams {
	name: 'AES-CBC';
}

interface IAesCtrParams extends AesCtrParams {
	name: 'AES-CTR';
}

interface IRsaOaepParams extends RsaOaepParams {
	name: 'RSA-OAEP';
}

type ParamsMap = {
	'AES-GCM': IAesGcmParams;
	'AES-CTR': IAesCtrParams;
	'AES-CBC': IAesCbcParams;
	'RSA-OAEP': IRsaOaepParams;
};

type ParamsOf<TKey extends IKey> = TKey['algorithm'] extends { name: infer TName extends keyof ParamsMap } ? ParamsMap[TName] : never;
type HasUsage<TKey extends IKey, TUsage extends KeyUsage> = TUsage extends TKey['usages'][number]
	? TKey
	: TKey & `The provided key cannot be used for ${TUsage}`;

export const encryptBuffer = <TKey extends IKey, TParams extends ParamsOf<TKey>>(
	key: HasUsage<TKey, 'encrypt'>,
	params: TParams,
	data: BufferSource,
): Promise<ArrayBuffer> => subtle.encrypt(params, key, data) as Promise<ArrayBuffer>;
export const decryptBuffer = <TKey extends IKey>(
	key: HasUsage<TKey, 'decrypt'>,
	params: ParamsOf<TKey>,
	data: BufferSource,
): Promise<ArrayBuffer> => subtle.decrypt(params, key, data) as Promise<ArrayBuffer>;
export const deriveBits = subtle.deriveBits.bind(subtle);

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

export type Exported<TFormat extends KeyFormat, TKey extends IKey = IKey> = TFormat extends 'jwk' ? KeyToJwk<TKey> : ArrayBuffer;

export async function exportKey<const TFormat extends KeyFormat = KeyFormat, const TKey extends IKey = IKey>(
	format: TFormat,
	key: TKey,
): Promise<Exported<TFormat, TKey>> {
	const exportedKey = await subtle.exportKey(format, key);
	return exportedKey as Exported<TFormat, TKey>;
}

type KtyParams = {
	oct: AesParams;
	RSA: RsaParams;
};

export async function importJwk<
	const TKeyData extends JsonWebKey,
	const TAlgorithm extends TKeyData extends { kty: infer Kty extends keyof KtyParams } ? KtyParams[Kty] : KeyAlgorithm,
	const TExtractable extends boolean = boolean,
	const TUsages extends KeyUsage[] = KeyUsage[],
	const TKeyType extends KeyType = TKeyData extends { kty: 'oct' }
		? 'secret'
		: TKeyData extends { kty: 'RSA'; key_ops: [infer Op] }
			? Op extends 'encrypt'
				? 'public'
				: 'private'
			: KeyType,
>(
	jwk: TKeyData,
	algorithm: TAlgorithm,
	extractable: TExtractable,
	keyUsages: TUsages,
): Promise<IKey<TAlgorithm, TExtractable, TKeyType, TUsages>> {
	const key = await subtle.importKey('jwk', jwk, algorithm, extractable, keyUsages);
	return key as IKey<TAlgorithm, TExtractable, TKeyType, TUsages>;
}

export async function importRaw<
	const TAlgorithm extends KeyAlgorithm = KeyAlgorithm,
	const TExtractable extends boolean = boolean,
	const TUsages extends KeyUsage[] = KeyUsage[],
>(
	rawKey: BufferSource,
	algorithm: TAlgorithm,
	extractable: TExtractable,
	keyUsages: TUsages,
): Promise<IKey<TAlgorithm, TExtractable, 'secret', TUsages>> {
	const key = await subtle.importKey('raw', rawKey, algorithm, extractable, keyUsages);
	return key as IKey<TAlgorithm, TExtractable, 'secret', TUsages>;
}
