export interface CryptoProvider {
	exportJsonWebKey(key: CryptoKey): Promise<JsonWebKey>;
	importRawKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey>;
	getRandomUint8Array(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
	getRandomUint16Array(array: Uint16Array<ArrayBuffer>): Uint16Array<ArrayBuffer>;
	getRandomUint32Array(array: Uint32Array<ArrayBuffer>): Uint32Array<ArrayBuffer>;
	generateKeyPair(): Promise<CryptoKeyPair>;
	decodeBase64(input: string): Uint8Array<ArrayBuffer>;
	encodeBase64(input: ArrayBuffer): string;
	decryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
	encryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
}

export interface EncodedPrivateKeyV1 {
	v: 1;
	mode: 'AES-CBC';
	kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number };
	ivB64: string;
	/** ciphertext */
	ctB64: string;
}

export type AnyEncodedPrivateKey = EncodedPrivateKeyV1; // forward compatible discriminated union

const ITERATIONS = 1000; // mirrors legacy implementation

export abstract class BaseKeyCodec {
	#crypto: CryptoProvider;

	constructor(deps: CryptoProvider) {
		this.#crypto = deps;
	}

	async generateRSAKeyPair(): Promise<{ publicJWK: JsonWebKey; privateJWK: JsonWebKey }> {
		const { generateKeyPair, exportJsonWebKey } = this.#crypto;

		const keyPair = await generateKeyPair();
		const publicJWK = await exportJsonWebKey(keyPair.publicKey);
		const privateJWK = await exportJsonWebKey(keyPair.privateKey);
		return { publicJWK, privateJWK };
	}

	async encodePrivateKey(privateKeyJwk: JsonWebKey, masterKey: CryptoKey): Promise<EncodedPrivateKeyV1> {
		const { getRandomUint8Array, encodeBase64, encryptAesCbc } = this.#crypto;

		const iv = getRandomUint8Array(new Uint8Array(16));
		const data = new TextEncoder().encode(JSON.stringify(privateKeyJwk));
		const ct = await encryptAesCbc(masterKey, iv, data);

		return {
			v: 1,
			mode: 'AES-CBC',
			kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS },
			ivB64: encodeBase64(iv.buffer),
			ctB64: encodeBase64(ct),
		};
	}

	async decodePrivateKey(encoded: AnyEncodedPrivateKey, masterKey: CryptoKey): Promise<JsonWebKey> {
		if (encoded.v !== 1) throw new Error(`Unsupported encoded private key version: ${encoded.v}`);
		if (encoded.mode !== 'AES-CBC') throw new Error(`Unsupported cipher mode: ${encoded.mode}`);
		const iv = this.#crypto.decodeBase64(encoded.ivB64);
		const ct = this.#crypto.decodeBase64(encoded.ctB64);
		try {
			const plain = await this.#crypto.decryptAesCbc(masterKey, iv, ct);
			return JSON.parse(new TextDecoder().decode(plain));
		} catch (e) {
			throw new Error('Failed to decrypt private key');
		}
	}

	async deriveMasterKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
		if (!password) throw new Error('Password is required');
		const enc = new TextEncoder();
		const baseKey = await this.#crypto.importRawKey(enc.encode(password));
		return crypto.subtle.deriveKey(
			{ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
			baseKey,
			{ name: 'AES-CBC', length: 256 },
			false,
			['encrypt', 'decrypt'],
		);
	}

	// Legacy helpers replicate existing Rocket.Chat behavior (vector + ciphertext joined) for staged migration.
	async legacyEncrypt(privateKeyJwkString: string, password: string, saltStr: string): Promise<Uint8Array<ArrayBuffer>> {
		const { getRandomUint8Array } = this.#crypto;
		const salt = new TextEncoder().encode(saltStr);
		const masterKey = await this.deriveMasterKey(password, salt);
		const iv = getRandomUint8Array(new Uint8Array(16));
		const data = new TextEncoder().encode(privateKeyJwkString);
		const ct = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, masterKey, data);
		const ctBytes = new Uint8Array(ct);
		const out = new Uint8Array(iv.length + ctBytes.length);
		out.set(iv, 0);
		out.set(ctBytes, iv.length);
		return out;
	}

	async legacyDecrypt(joined: ArrayBuffer | Uint8Array, password: string, saltStr: string): Promise<string> {
		const bytes = joined instanceof Uint8Array ? joined : new Uint8Array(joined);
		if (bytes.length < 17) throw new Error('Invalid legacy encrypted blob');
		const iv = bytes.slice(0, 16);
		const ct = bytes.slice(16);
		const salt = new TextEncoder().encode(saltStr);
		const masterKey = await this.deriveMasterKey(password, salt);
		try {
			const plain = await this.#crypto.decryptAesCbc(masterKey, iv, ct);
			return new TextDecoder().decode(plain);
		} catch (e) {
			throw new Error('Failed to decrypt legacy private key');
		}
	}

	async generateMnemonicPhrase(n: number, sep = ' '): Promise<string> {
		const wordList = await import('./wordList.ts');
		const result = new Array(n);
		const randomBuffer = new Uint32Array(n);
		this.#crypto.getRandomUint32Array(randomBuffer);
		for (let i = 0; i < n; i++) {
			result[i] = wordList.v1[randomBuffer[i]! % wordList.v1.length]!;
		}
		return result.join(sep);
	}
}
