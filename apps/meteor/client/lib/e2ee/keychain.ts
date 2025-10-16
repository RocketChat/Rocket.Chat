import { Base64 } from '@rocket.chat/base64';

import { Binary } from './binary';
import type { Codec } from './codec';
import * as Pbkdf2 from './pbkdf2';

const generateSalt = (userId: string): string => `v2:${userId}:${crypto.randomUUID()}`;

/**
 * Version 1 format:
 * ```
 * { $binary: base64(iv[16] + ciphertext) }
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
 * ```
 * { iv: base64(iv[12]), ciphertext: base64(data[...]), salt: string(), iterations: number() }
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
const StoredKey: Codec<string, StoredKey> = {
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

type EncryptedKey = {
	content: {
		iv: Uint8Array<ArrayBuffer>;
		ciphertext: Uint8Array<ArrayBuffer>;
	};
	options: {
		salt: string;
		iterations: number;
	};
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
const EncryptedKey: Codec<StoredKey, EncryptedKey> = {
	encode: (encryptedKey) => {
		return {
			iv: Base64.encode(encryptedKey.content.iv),
			ciphertext: Base64.encode(encryptedKey.content.ciphertext),
			salt: encryptedKey.options.salt,
			iterations: encryptedKey.options.iterations,
		};
	},
	decode: (storedKey) => {
		if ('$binary' in storedKey) {
			// v1
			const binary = Base64.decode(storedKey.$binary);
			const iv = binary.slice(0, 16);
			const ciphertext = binary.slice(16);

			return {
				content: { iv, ciphertext },
				options: {
					salt: '',
					iterations: 1000,
				},
			};
		}

		// v2
		const { iv, ciphertext, salt, iterations } = storedKey;
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
	},
};

export class Keychain {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	async decryptKey(privateKey: string, password: string): Promise<string> {
		const storedKey = StoredKey.decode(privateKey);
		const { content, options } = EncryptedKey.decode(storedKey);
		options.salt = options.salt ? options.salt : this.userId;
		const algorithm = content.iv.length === 16 ? 'AES-CBC' : 'AES-GCM';
		const baseKey = await Pbkdf2.importBaseKey(new Uint8Array(Binary.toArrayBuffer(password)));
		const derivedBits = await Pbkdf2.deriveBits(baseKey, {
			salt: new Uint8Array(Binary.toArrayBuffer(options.salt)),
			iterations: options.iterations,
		});
		const key = await Pbkdf2.importKey(derivedBits, algorithm);
		const decrypted = await Pbkdf2.decrypt(key, content);
		return Binary.toString(decrypted.buffer);
	}

	async encryptKey(privateKey: string, password: string): Promise<EncryptedKey> {
		const salt = generateSalt(this.userId);
		const iterations = 100_000;
		const algorithm = 'AES-GCM';
		const baseKey = await Pbkdf2.importBaseKey(new Uint8Array(Binary.toArrayBuffer(password)));
		const derivedBits = await Pbkdf2.deriveBits(baseKey, { salt: new Uint8Array(Binary.toArrayBuffer(salt)), iterations });
		const key = await Pbkdf2.importKey(derivedBits, algorithm);
		const content = await Pbkdf2.encrypt(key, new Uint8Array(Binary.toArrayBuffer(privateKey)));

		return {
			content,
			options: {
				salt,
				iterations,
			},
		};
	}
}
