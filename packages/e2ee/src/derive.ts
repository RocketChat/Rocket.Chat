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

export const importPbkdf2Key = (password: string): Promise<CryptoKey> =>
	crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
