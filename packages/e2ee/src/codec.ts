export interface CryptoProvider {
	/**
	 * @example
	 * (key) => await crypto.subtle.exportKey('jwk', key)
	 */
	exportJsonWebKey(key: CryptoKey): Promise<JsonWebKey>;
	/**
	 * @example
	 * (raw) => crypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey'])
	 */
	importRawKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey>;
	/**
	 * @example
	 * (key) => crypto.subtle.importKey('jwk', key, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['decrypt'])
	 */
	importRsaDecryptKey(key: JsonWebKey): Promise<CryptoKey>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint8Array(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint16Array(array: Uint16Array<ArrayBuffer>): Uint16Array<ArrayBuffer>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint32Array(array: Uint32Array<ArrayBuffer>): Uint32Array<ArrayBuffer>;
	/**
	 * @example
	 * crypto.subtle.generateKey(
	 *   { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
	 *   true,
	 *   ['encrypt', 'decrypt'],
	 * )
	 */
	generateKeyPair(): Promise<CryptoKeyPair>;
	/**
	 * @example
	 * (input) => {
	 *   const binaryString = atob(input);
	 *   const len = binaryString.length;
	 *   const bytes = new Uint8Array(len);
	 *   for (let i = 0; i < len; i++) {
	 *     bytes[i] = binaryString.charCodeAt(i);
	 *   }
	 *   return bytes;
	 * }
	 */
	decodeBase64(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * (input) => {
	 *    const bytes = new Uint8Array(input);
	 *    let binaryString = '';
	 *    for (let i = 0; i < bytes.byteLength; i++) {
	 *        binaryString += String.fromCharCode(bytes[i]!);
	 *    }
	 *   return btoa(binaryString);
	 * }
	 */
	encodeBase64(input: ArrayBuffer): string;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (text: string): Uint8Array<ArrayBuffer> => {
	 *   const encoder = new TextEncoder();
	 *   const buffer = new Uint8Array();
	 *   encoder.encodeInto(text, buffer);
	 *   return buffer;
	 * }
	 * ```
	 */
	encodeBinary(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (input) => new TextEncoder().encode(input)
	 * ```
	 */
	encodeUtf8(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (input) => TextDecoder().decode(input)
	 * ```
	 */
	decodeUtf8(input: ArrayBuffer): string;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data)
	 * ```
	 */
	decryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (key, iv, data) => crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data)
	 * ````
	 */
	encryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * (key, iv, data) => crypto.subtle.deriveKey(
	 *  {
	 *    name: 'PBKDF2',
	 *    salt,
	 *    iterations: 1000,
	 *    hash: 'SHA-256',
	 *  },
	 *  baseKey,
	 *  {
	 *    name: 'AES-CBC',
	 *    length: 256,
	 *  },
	 *  false,
	 *  ['encrypt', 'decrypt']
	 * )
	 */
	deriveKeyWithPbkdf2(salt: ArrayBuffer, baseKey: CryptoKey): Promise<CryptoKey>;
}

export interface JsonWebKeyPair {
	privateJWK: JsonWebKey;
	publicJWK: JsonWebKey;
}

const V1_ITERATIONS = 1000; // mirrors legacy implementation
export interface EncodedPrivateKeyV1 {
	version: '1';
	mode: 'AES-CBC';
	kdf: {
		name: 'PBKDF2';
		hash: 'SHA-256';
		iterations: typeof V1_ITERATIONS;
	};
	ivB64: string;
	/** ciphertext */
	ctB64: string;
}

export type AnyEncodedPrivateKey = EncodedPrivateKeyV1; // forward compatible discriminated union
export abstract class BaseKeyCodec {
	#crypto: CryptoProvider;

	get crypto(): CryptoProvider {
		return this.#crypto;
	}

	constructor(crypto: CryptoProvider) {
		this.#crypto = crypto;
	}

	async generateRSAKeyPair(): Promise<JsonWebKeyPair> {
		const { generateKeyPair, exportJsonWebKey } = this.#crypto;

		const keyPair = await generateKeyPair();
		const publicJWK = await exportJsonWebKey(keyPair.publicKey);
		const privateJWK = await exportJsonWebKey(keyPair.privateKey);
		return { privateJWK, publicJWK };
	}

	async encodePrivateKey(privateKeyJwk: JsonWebKey, masterKey: CryptoKey): Promise<EncodedPrivateKeyV1> {
		const { getRandomUint8Array, encodeBase64, encryptAesCbc, encodeUtf8 } = this.#crypto;
		const IV_LENGTH = 16;
		const iv = getRandomUint8Array(new Uint8Array(IV_LENGTH));
		const data = encodeUtf8(JSON.stringify(privateKeyJwk));
		const ct = await encryptAesCbc(masterKey, iv, data);

		return {
			ctB64: encodeBase64(ct),
			ivB64: encodeBase64(iv.buffer),
			kdf: { hash: 'SHA-256', iterations: V1_ITERATIONS, name: 'PBKDF2' },
			mode: 'AES-CBC',
			version: '1',
		};
	}

	async decodePrivateKey(encoded: AnyEncodedPrivateKey, masterKey: CryptoKey): Promise<JsonWebKey> {
		if (encoded.version !== '1') {
			throw new Error(`Unsupported encoded private key version: ${encoded.version}`);
		}
		if (encoded.mode !== 'AES-CBC') {
			throw new Error(`Unsupported cipher mode: ${encoded.mode}`);
		}
		const iv = this.#crypto.decodeBase64(encoded.ivB64);
		const ct = this.#crypto.decodeBase64(encoded.ctB64);
		try {
			const plain = await this.#crypto.decryptAesCbc(masterKey, iv, ct);
			return JSON.parse(this.#crypto.decodeUtf8(plain)) as JsonWebKey;
		} catch {
			throw new Error('Failed to decrypt private key');
		}
	}

	encodeSalt(token: string): Uint8Array<ArrayBuffer> {
		return this.#crypto.encodeUtf8(token);
	}

	decodeSalt(salt: Uint8Array<ArrayBuffer>): string {
		return this.#crypto.decodeUtf8(salt.buffer);
	}

	createBaseKey(password: string): Promise<CryptoKey> {
		if (!password) {
			throw new Error('Password is required');
		}
		const { encodeBinary, importRawKey } = this.#crypto;
		return importRawKey(encodeBinary(password));
	}

	deriveKey(salt: string, baseKey: CryptoKey): Promise<CryptoKey> {
		return this.#crypto.deriveKeyWithPbkdf2(this.#crypto.encodeUtf8(salt).buffer, baseKey);
	}

	async deriveMasterKey(salt: Uint8Array<ArrayBuffer>, password: string): Promise<CryptoKey> {
		if (!password) {
			throw new Error('Password is required');
		}
		const { encodeUtf8, deriveKeyWithPbkdf2, importRawKey } = this.#crypto;

		try {
			const baseKey = await importRawKey(encodeUtf8(password));
			return deriveKeyWithPbkdf2(salt.buffer, baseKey);
		} catch (error) {
			if (error instanceof Error) {
				throw new TypeError(`Invalid password: ${error.message}`);
			} else {
				throw error;
			}
		}
	}

	// Legacy helpers replicate existing Rocket.Chat behavior (vector + ciphertext joined) for staged migration.
	async legacyEncrypt(privateKeyJwkString: string, password: string, saltStr: string): Promise<Uint8Array<ArrayBuffer>> {
		const { getRandomUint8Array, encodeUtf8, encryptAesCbc } = this.#crypto;
		const IV_LENGTH = 16;
		const salt = encodeUtf8(saltStr);
		const masterKey = await this.deriveMasterKey(salt, password);
		const iv = getRandomUint8Array(new Uint8Array(IV_LENGTH));
		const data = encodeUtf8(privateKeyJwkString);
		const ct = await encryptAesCbc(masterKey, iv, data);
		const ctBytes = new Uint8Array(ct);
		const out = new Uint8Array(iv.length + ctBytes.length);
		out.set(iv);
		out.set(ctBytes, iv.length);
		return out;
	}

	async legacyDecrypt(bytes: Uint8Array<ArrayBuffer>, password: string, saltStr: string): Promise<JsonWebKey> {
		const LEGACY_IV_START = 0;
		const LEGACY_IV_LENGTH = 16;
		if (bytes.length <= LEGACY_IV_LENGTH) {
			throw new TypeError('Invalid legacy encrypted blob');
		}

		const { encodeUtf8, decodeUtf8 } = this.#crypto;

		const iv = bytes.slice(LEGACY_IV_START, LEGACY_IV_LENGTH);
		const ct = bytes.slice(LEGACY_IV_LENGTH);
		const salt = encodeUtf8(saltStr);
		const masterKey = await this.deriveMasterKey(salt, password);
		try {
			const plain = await this.#crypto.decryptAesCbc(masterKey, iv, ct);
			return JSON.parse(decodeUtf8(plain)) as JsonWebKey;
		} catch {
			throw new Error('Failed to decrypt legacy private key');
		}
	}

	async generateMnemonicPhrase(length: number): Promise<string> {
		const { v1 } = await import('./word-list.ts');
		const randomBuffer = new Uint32Array(length);
		this.#crypto.getRandomUint32Array(randomBuffer);
		return Array.from(randomBuffer, (value) => v1[value % v1.length]).join(' ');
	}
}
