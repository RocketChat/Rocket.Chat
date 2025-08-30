export const derivePbkdf2Key = (salt: string, baseKey: CryptoKey): Promise<CryptoKey> =>
	crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode(salt),
			iterations: 10_000,
			hash: 'SHA-256',
		},
		baseKey,
		{
			name: 'AES-CBC',
			length: 256,
		},
		false,
		['encrypt', 'decrypt'],
	);

export const importPbkdf2Key = (password: string): Promise<CryptoKey> => {
	if (!password) {
		throw new Error('Password is required');
	}

	const encoder = new TextEncoder();
	const dest = new Uint8Array(password.length);
	encoder.encodeInto(password, dest);

	return crypto.subtle.importKey('raw', dest, { name: 'PBKDF2' }, false, ['deriveKey']);
};
