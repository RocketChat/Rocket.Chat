import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'ec1';

export class CalendarSecretBox {
	private constructor(private readonly key: Buffer) {}

	static fromBase64Key(value: string | undefined): CalendarSecretBox {
		if (!value) throw new Error('enterprise-calendar-encryption-key-required');
		const key = Buffer.from(value, 'base64');
		if (key.length !== 32) throw new Error('enterprise-calendar-encryption-key-must-be-32-bytes');
		return new CalendarSecretBox(key);
	}

	encrypt(plaintext: string, context: string): string {
		const nonce = randomBytes(12);
		const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
		cipher.setAAD(Buffer.from(context));
		const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
		return [PREFIX, nonce.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
	}

	decrypt(value: string, context: string): string {
		const [prefix, encodedNonce, encodedTag, encodedCiphertext] = value.split('.');
		if (prefix !== PREFIX || !encodedNonce || !encodedTag || !encodedCiphertext) throw new Error('invalid-encrypted-calendar-secret');
		const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(encodedNonce, 'base64url'));
		decipher.setAAD(Buffer.from(context));
		decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
		return Buffer.concat([decipher.update(Buffer.from(encodedCiphertext, 'base64url')), decipher.final()]).toString('utf8');
	}
}
