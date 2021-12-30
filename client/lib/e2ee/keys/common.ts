import { exportJWKKey, importRSAKey } from '../helpers';

export const parsePublicKey = async (keyString: string): Promise<CryptoKey> => {
	const keyJWK: JsonWebKey = JSON.parse(keyString);
	return importRSAKey(keyJWK, ['encrypt']);
};

export const parsePrivateKey = async (keyString: string): Promise<CryptoKey> => {
	const keyJWK: JsonWebKey = JSON.parse(keyString);
	return importRSAKey(keyJWK, ['decrypt']);
};

export const stringifyKey = async (key: CryptoKey): Promise<string> => {
	const keyJWK = await exportJWKKey(key);
	return JSON.stringify(keyJWK);
};
