import type { X25519SecretKey, CryptographyKey } from 'sodium-plus';
import { SodiumPlus, X25519PublicKey } from 'sodium-plus';

export class Session {
	// Encoding for the key exchange, no requirements to be small
	protected readonly stringFormatKey: BufferEncoding = 'base64';

	// Encoding for the transfer of encrypted data, should be smaller as possible
	protected readonly stringFormatEncryptedData: BufferEncoding = 'base64';

	// Encoding before the encryption to keep unicode chars
	protected readonly stringFormatRawData: BufferEncoding = 'base64';

	protected decryptKey: CryptographyKey;

	protected encryptKey: CryptographyKey;

	protected secretKey: X25519SecretKey;

	public publicKey: X25519PublicKey;

	private static sodium: SodiumPlus | undefined;

	async sodium(): Promise<SodiumPlus> {
		if (!Session.sodium) {
			Session.sodium = await SodiumPlus.auto();
		}

		return Session.sodium;
	}

	get publicKeyString(): string {
		return this.publicKey.toString(this.stringFormatKey);
	}

	publicKeyFromString(text: string): X25519PublicKey {
		return new X25519PublicKey(Buffer.from(text, this.stringFormatKey));
	}

	async encryptToBuffer(plaintext: string | Buffer): Promise<Buffer> {
		const sodium = await this.sodium();
		const nonce = await sodium.randombytes_buf(24);

		const buffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext);

		const ciphertext = await sodium.crypto_secretbox(Buffer.from(buffer).toString(this.stringFormatRawData), nonce, this.encryptKey);

		return Buffer.concat([nonce, ciphertext]);
	}

	async encrypt(plaintext: string | Buffer): Promise<string> {
		const buffer = await this.encryptToBuffer(plaintext);
		return buffer.toString(this.stringFormatEncryptedData);
	}

	async decryptToBuffer(data: string | Buffer): Promise<Buffer> {
		const sodium = await this.sodium();
		const buffer = Buffer.from(Buffer.isBuffer(data) ? data.toString() : data, this.stringFormatEncryptedData);

		const decrypted = await sodium.crypto_secretbox_open(buffer.slice(24), buffer.slice(0, 24), this.decryptKey);

		return Buffer.from(decrypted.toString(), this.stringFormatRawData);
	}

	async decrypt(data: string | Buffer): Promise<string> {
		const buffer = await this.decryptToBuffer(data);
		return buffer.toString();
	}
}
