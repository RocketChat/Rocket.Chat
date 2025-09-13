interface IEncryptedContent {
	/**
	 * The encryption algorithm used.
	 * Currently supported algorithms are:
	 * - `rc.v1.aes-sha2`: Rocket.Chat E2E Encryption version 1, using AES encryption with SHA-256 hashing.
	 * - `rc.v2.aes-sha2`: Rocket.Chat E2E Encryption version 2, using AES encryption with SHA-256 hashing and improved key management.
	 */
	algorithm: string;
	ciphertext: string; // base64-encoded encrypted subset JSON of IMessage
}

interface IEncryptedContentV1 extends IEncryptedContent {
	/**
	 * The encryption algorithm used.
	 */
	algorithm: 'rc.v1.aes-sha2'
}

interface IEncryptedContentV2 extends IEncryptedContent {
	algorithm: 'rc.v2.aes-sha2',
	iv: string; // base64-encoded initialization vector
	key_id: string; // ID of the key used to encrypt the message
}

export type EncryptedContent = IEncryptedContentV1 | IEncryptedContentV2;
