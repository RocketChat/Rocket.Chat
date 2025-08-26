export const isJsonWebKey = (data: unknown): data is JsonWebKey => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const obj = data as Record<string, unknown>;
	if (typeof obj.kty !== 'string') {
		return false;
	}

	switch (obj.kty) {
		case 'oct': {
			// Symmetric key: must have "k"
			return typeof obj.k === 'string';
		}
		case 'RSA': {
			// RSA public/private key: must have "n" and "e"
			return typeof obj.n === 'string' && typeof obj.e === 'string';
		}
		case 'EC': {
			// EC public/private key: must have "crv", "x", "y"
			return typeof obj.crv === 'string' && typeof obj.x === 'string' && typeof obj.y === 'string';
		}
		case 'OKP': {
			// OKP (e.g., Ed25519): must have "crv" and "x"
			return typeof obj.crv === 'string' && typeof obj.x === 'string';
		}
		default:
			return false;
	}
};

export const isAesGcm = (jwk: JsonWebKey): jwk is Omit<JsonWebKey, 'kty' | 'alg'> & { kty: 'oct'; alg: 'A256GCM' } =>
	jwk.kty === 'oct' && jwk.alg === 'A256GCM';
export const isAesCbc = (jwk: JsonWebKey): jwk is Omit<JsonWebKey, 'kty' | 'alg'> & { kty: 'oct'; alg: 'A128CBC' } =>
	jwk.kty === 'oct' && jwk.alg === 'A128CBC';

export const parseJsonWebKey = (json: string): JsonWebKey => {
	const obj = JSON.parse(json);
	if (!isJsonWebKey(obj)) {
		throw new Error('Invalid JSON Web Key');
	}
	return obj;
};
