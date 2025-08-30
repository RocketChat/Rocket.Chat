export interface Jwk<Kty extends string = string, Alg extends string = string> {
	kty: Kty;
	alg: Alg;
}

export const is = (data: unknown): data is Jwk => {
	if (typeof data !== 'object') {
		return false;
	}

	if (data === null) {
		return false;
	}

	if (!('kty' in data)) {
		return false;
	}

	if (typeof data.kty !== 'string') {
		return false;
	}

	switch (data.kty) {
		case 'oct': {
			// Symmetric key: must have "k"
			return 'k' in data && typeof data.k === 'string';
		}
		case 'RSA': {
			// RSA public/private key: must have "n" and "e"
			return 'n' in data && typeof data.n === 'string' && 'e' in data && typeof data.e === 'string';
		}
		case 'EC': {
			// EC public/private key: must have "crv", "x", "y"
			return (
				'crv' in data &&
				typeof data.crv === 'string' &&
				'x' in data &&
				typeof data.x === 'string' &&
				'y' in data &&
				typeof data.y === 'string'
			);
		}
		case 'OKP': {
			// OKP (e.g., Ed25519): must have "crv" and "x"
			return 'crv' in data && typeof data.crv === 'string' && 'x' in data && typeof data.x === 'string';
		}
		default: {
			return false;
		}
	}
};

const isKey =
	<const Kty extends string, const Alg extends string>(kty: Kty, alg: Alg): ((jwk: Partial<Jwk>) => jwk is Jwk<Kty, Alg>) =>
	(jwk): jwk is Jwk<Kty, Alg> =>
		jwk.kty === kty && jwk.alg === alg;

/** {@link !CryptoKey} */
export const isAesGcm = (jwk: Partial<Jwk>): jwk is Jwk<'oct', 'A256GCM'> => isKey('oct', 'A256GCM')(jwk);
export const isAesCbc = (jwk: Partial<Jwk>): jwk is Jwk<'oct', 'A128CBC'> => isKey('oct', 'A128CBC')(jwk);

export const isRsaOaep = (jwk: Partial<Jwk>): jwk is Jwk<'RSA', 'RSA-OAEP-256'> => isKey('RSA', 'RSA-OAEP-256')(jwk);

export const parse = (json: string): Jwk => {
	const obj = JSON.parse(json);
	if (!is(obj)) {
		throw new TypeError('Invalid JSON Web Key');
	}
	return obj;
};
