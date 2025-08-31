function encode(str: string) {
	return new TextEncoder().encode(str);
}

// A helper function to decode a Uint8Array to a string
function decode(buf: ArrayBuffer) {
	return new TextDecoder().decode(buf);
}

export interface EncryptedPackage {
	ciphertext: ArrayBuffer;
	wrappedAesKeys: ArrayBuffer[];
	iv: Uint8Array<ArrayBuffer>;
}
export interface EncryptedData {
	ciphertext: ArrayBuffer;
	iv: Uint8Array<ArrayBuffer>;
}

export async function decryptMessage(
	encryptedData: EncryptedData,
	recipientPrivateKey: CryptoKey,
	recipientWrappedKey: ArrayBuffer,
): Promise<string> {
	const unwrappedAesKey = await crypto.subtle.unwrapKey(
		'raw',
		recipientWrappedKey,
		recipientPrivateKey,
		{ name: 'RSA-OAEP' },
		{ name: 'AES-GCM', length: 256 },
		true,
		['decrypt'],
	);
	const decryptedText = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encryptedData.iv }, unwrappedAesKey, encryptedData.ciphertext);
	return new TextDecoder().decode(decryptedText);
}

/**
 * Creates a new symmetric key and rekeys for all current group members and a new one.
 * @param recipientPublicKeys Array of public keys for all recipients (old and new).
 * @param plaintext Optional message to send with the key update.
 * @returns Encrypted package with a new symmetric key for the group.
 */
export async function rekeyGroupAndEncrypt(
	recipientPublicKeys: Array<CryptoKey>,
	plaintext: string = 'New member joined.',
): Promise<EncryptedPackage> {
	// 1. Generate a brand new, one-time AES-GCM key for this message and all future messages
	const newAesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

	// 2. Generate a random Initialization Vector (IV) for AES
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// 3. Encrypt the plaintext message with the new AES key
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, newAesKey, encode(plaintext));

	// 4. Wrap the new AES key with each recipient's public key
	const wrappedAesKeys = await Promise.all(
		recipientPublicKeys.map((key) => crypto.subtle.wrapKey('raw', newAesKey, key, { name: 'RSA-OAEP' })),
	);

	// 5. Combine all parts into a single package
	return {
		ciphertext,
		wrappedAesKeys,
		iv,
	};
}

// --- DECRYPTION (Recipient's side) ---

/**
 * Decrypts a group message using a recipient's private key.
 * @param encryptedData The encrypted package.
 * @param recipientPrivateKey The recipient's private key.
 * @param recipientIndex The recipient's index in the group.
 * @returns The decrypted plaintext.
 */
export async function decryptForGroup(
	encryptedData: { wrappedAesKeys: ArrayBuffer[]; iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer },
	recipientPrivateKey: CryptoKey,
	recipientIndex: number,
): Promise<string> {
	// 1. Unwrap the specific AES key intended for this recipient
	const wrappedAesKey = encryptedData.wrappedAesKeys[recipientIndex]!;
	const unwrappedAesKey = await crypto.subtle.unwrapKey(
		'raw',
		wrappedAesKey,
		recipientPrivateKey,
		{ name: 'RSA-OAEP' },
		{ name: 'AES-GCM', length: 256 },
		true,
		['decrypt'],
	);

	// 2. Decrypt the message ciphertext with the unwrapped AES key
	const decryptedText = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encryptedData.iv }, unwrappedAesKey, encryptedData.ciphertext);

	return decode(decryptedText);
}
