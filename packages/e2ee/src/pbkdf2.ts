/**
 * Derives a non-extractable 256-bit AES-CBC key using PBKDF2.
 *
 * Uses UTF-8 encoded salt, 100,000 iterations, and SHA-256 as the PRF.
 * The resulting key is created with usages ['encrypt', 'decrypt'] and is not extractable.
 *
 * @param salt - UTF-8 string used as the PBKDF2 salt. Prefer a cryptographically random salt.
 * @param baseKey - A PBKDF2-capable CryptoKey (e.g., from {@link importPbkdf2Key}).
 * @returns A promise that resolves to the derived AES-CBC CryptoKey.
 * @remarks Requires a Web Crypto SubtleCrypto implementation (e.g., in modern browsers).
 * @see https://developer.mozilla.org/docs/Web/API/SubtleCrypto/deriveKey
 */
export const derivePbkdf2Key = async (salt: string, baseKey: CryptoKey): Promise<CryptoKey> => {
	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode(salt),
			iterations: 100_000,
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

	return derivedKey;
};

/**
 * Imports a passphrase as a non-extractable PBKDF2 base {@link CryptoKey}.
 *
 * The passphrase is UTF-8 encoded and the resulting key can only be used for 'deriveKey'.
 *
 * @param passphrase - Human-readable secret to be used as PBKDF2 input.
 * @returns A promise that resolves to a PBKDF2 CryptoKey with usage ['deriveKey'].
 * @remarks Pair this with {@link derivePbkdf2Key} to derive an encryption key.
 * @see https://w3c.github.io/webcrypto/#pbkdf2-operations-import-key
 */
export const importPbkdf2Key = async (passphrase: string): Promise<CryptoKey> => {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
	return key;
};
