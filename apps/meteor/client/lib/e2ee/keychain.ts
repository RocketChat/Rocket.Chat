import { Base64 } from '@rocket.chat/base64';

import { Binary } from './binary';
import type { ICodec } from './codec';
import * as Pbkdf2 from './crypto/pbkdf2';
import { randomUUID } from './crypto/shared';

/**
 * Version 1 format:
 * ```
 * json({ $binary: base64(iv[16] + ciphertext) })
 * ```
 */
interface IStoredKeyV1 {
	/**
	 * Base64-encoded binary data
	 * - first 16 bytes are the IV
	 * - remaining bytes are the ciphertext
	 */
	$binary: string;
}
/**
 * Version 2 format:
 * ```typescript
 * json({ iv: base64(iv[12]), ciphertext: base64(data[...]), salt: string(), iterations: number() })
 * ```
 */
interface IStoredKeyV2 {
	iv: string;
	ciphertext: string;
	salt: string;
	iterations: number;
}

type StoredKey = IStoredKeyV1 | IStoredKeyV2;

// eslint-disable-next-line @typescript-eslint/no-redeclare
const StoredKey: ICodec<string, StoredKey> = {
	decode: (data) => {
		const json: unknown = JSON.parse(data);

		if (typeof json !== 'object' || json === null) {
			throw new TypeError('Invalid private key format');
		}

		if ('$binary' in json && typeof json.$binary === 'string') {
			return { $binary: json.$binary } satisfies IStoredKeyV1;
		}

		if (
			'iv' in json &&
			typeof json.iv === 'string' &&
			'ciphertext' in json &&
			typeof json.ciphertext === 'string' &&
			'salt' in json &&
			typeof json.salt === 'string' &&
			'iterations' in json &&
			typeof json.iterations === 'number'
		) {
			return { iv: json.iv, ciphertext: json.ciphertext, salt: json.salt, iterations: json.iterations } satisfies IStoredKeyV2;
		}

		throw new TypeError('Invalid private key format');
	},
	encode: (data) => JSON.stringify(data),
};

type EncryptedKeyContent = {
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: Uint8Array<ArrayBuffer>;
};

type EncryptedKeyOptions = {
	salt: string;
	iterations: number;
};

type EncryptedKey = {
	content: EncryptedKeyContent;
	options: EncryptedKeyOptions;
};

class EncryptedKeyCodec implements ICodec<string, EncryptedKey, IStoredKeyV2> {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	encode(encryptedKey: EncryptedKey): IStoredKeyV2 {
		return {
			iv: Base64.encode(encryptedKey.content.iv),
			ciphertext: Base64.encode(encryptedKey.content.ciphertext),
			salt: encryptedKey.options.salt,
			iterations: encryptedKey.options.iterations,
		};
	}

	decode(storedKey: string): EncryptedKey {
		const storedKeyObj = StoredKey.decode(storedKey);
		if ('$binary' in storedKeyObj) {
			// v1
			const binary = Base64.decode(storedKeyObj.$binary);

			return {
				content: { iv: binary.slice(0, 16), ciphertext: binary.slice(16) },
				options: {
					salt: this.userId,
					iterations: 1000,
				},
			};
		}

		// v2
		const { iv, ciphertext, salt, iterations } = storedKeyObj;
		return {
			content: {
				iv: Base64.decode(iv),
				ciphertext: Base64.decode(ciphertext),
			},
			options: {
				salt,
				iterations,
			},
		};
	}
}

export class Keychain {
	private readonly userId: string;

	private readonly codec: EncryptedKeyCodec;

	constructor(userId: string) {
		this.userId = userId;
		this.codec = new EncryptedKeyCodec(userId);
	}

	async decryptKey(privateKey: string, password: string): Promise<string> {
		const { content, options } = this.codec.decode(privateKey);
		const algorithm = content.iv.length === 16 ? 'AES-CBC' : 'AES-GCM';
		const baseKey = await Pbkdf2.importBaseKey(new Uint8Array(Binary.decode(password)));
		const derivedBits = await Pbkdf2.derive(baseKey, {
			salt: new Uint8Array(Binary.decode(options.salt)),
			iterations: options.iterations,
		});
		const key = await Pbkdf2.importKey(derivedBits, { name: algorithm, length: 256 });
		const decrypted = await Pbkdf2.decrypt(key, content);
		return Binary.encode(decrypted.buffer);
	}

	async encryptKey(privateKey: string, password: string): Promise<IStoredKeyV2> {
		const salt = `v2:${this.userId}:${randomUUID()}`;
		const iterations = 100_000;
		const algorithm = 'AES-GCM';
		const baseKey = await Pbkdf2.importBaseKey(new Uint8Array(Binary.decode(password)));
		const derivedBits = await Pbkdf2.derive(baseKey, { salt: new Uint8Array(Binary.decode(salt)), iterations });
		const key = await Pbkdf2.importKey(derivedBits, { name: algorithm, length: 256 });
		const content = await Pbkdf2.encrypt(key, new Uint8Array(Binary.decode(privateKey)));

		return this.codec.encode({ content, options: { salt, iterations } });
	}
}
