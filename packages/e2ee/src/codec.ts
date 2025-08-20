import type { CryptoProvider } from './crypto.ts';

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

	async generateRsaOaepKeyPair(): Promise<JsonWebKeyPair> {
		const { generateRsaOaepKeyPair, exportJsonWebKey } = this.#crypto;

		const keyPair = await generateRsaOaepKeyPair();
		const publicJWK = await exportJsonWebKey(keyPair.publicKey);
		const privateJWK = await exportJsonWebKey(keyPair.privateKey);
		return { privateJWK, publicJWK };
	}

	getRandomUint8Array(length: number): Uint8Array<ArrayBuffer> {
		return this.#crypto.getRandomUint8Array(new Uint8Array(length));
	}

	getRandomUint32Array(length: number): Uint32Array<ArrayBuffer> {
		return this.#crypto.getRandomUint32Array(new Uint32Array(length));
	}

	async encodePrivateKey(privateKeyJwk: JsonWebKey, masterKey: CryptoKey): Promise<EncodedPrivateKeyV1> {
		const { encodeBase64, encryptAesCbc, encodeUtf8 } = this.#crypto;
		const IV_LENGTH = 16;
		const iv = this.getRandomUint8Array(IV_LENGTH);
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
		const { encodeUtf8, encryptAesCbc } = this.#crypto;
		const IV_LENGTH = 16;
		const salt = encodeUtf8(saltStr);
		const masterKey = await this.deriveMasterKey(salt, password);
		const iv = this.getRandomUint8Array(IV_LENGTH);
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
		const randomBuffer = this.getRandomUint32Array(length);
		return Array.from(randomBuffer, (value) => v1[value % v1.length]).join(' ');
	}

	stringifyUint8Array(data: Uint8Array<ArrayBuffer>): string {
		return JSON.stringify({
			$binary: this.#crypto.encodeBase64(data.buffer),
		});
	}

	parseUint8Array(json: string): Uint8Array<ArrayBuffer> {
		const { $binary } = JSON.parse(json);
		const binaryString = this.#crypto.decodeBase64($binary);
		return new Uint8Array(binaryString);
	}
}
