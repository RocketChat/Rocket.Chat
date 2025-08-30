import { type AsyncResult, err, ok } from './result.ts';
import { joinVectorAndEncryptedData, splitVectorAndEncryptedData } from './vector.ts';
import { toArrayBuffer, toString } from './binary.ts';

export * as Jwk from './jwk.ts';
import * as Jwk from './jwk.ts';

import { stringifyUint8Array, parseUint8Array } from './base64.ts';
import { importPbkdf2Key, deriveKeyWithPbkdf2 } from './derive.ts';
import { generateRsaOaepKeyPair } from './crypto.ts';

const generateMnemonicPhrase = async (length: number): Promise<string> => {
	const { v1 } = await import('./word-list.ts');
	const randomBuffer = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(randomBuffer, (value) => v1[value % v1.length]).join(' ');
};

export interface KeyService {
	userId: () => Promise<string | null>;
	fetchMyKeys: () => Promise<RemoteKeyPair>;
	persistKeys: (keys: RemoteKeyPair, force: boolean) => Promise<unknown>;
}

export type PrivateKey = string;
export type PublicKey = string;

export interface RemoteKeyPair {
	public_key: string;
	private_key: string;
}

export interface LocalKeyPair {
	public_key: string | null | undefined;
	private_key: string | null | undefined;
}

export interface KeyPair {
	privateKey: CryptoKey;
	publicKey: JsonWebKey;
}

export default class E2EE {
	#service: KeyService;

	constructor(service: KeyService) {
		this.#service = service;
	}

	async loadKeys({ public_key, private_key }: RemoteKeyPair): AsyncResult<CryptoKey, Error> {
		try {
			const res = await crypto.subtle.importKey('jwk', Jwk.parse(private_key), { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, [
				'decrypt',
			]);
			localStorage.setItem('public_key', public_key);
			localStorage.setItem('private_key', private_key);
			return ok(res);
		} catch (error) {
			return err(new Error('Error loading keys', { cause: error }));
		}
	}

	async createAndLoadKeys(): AsyncResult<KeyPair, Error> {
		try {
			const keys = await generateRsaOaepKeyPair();
			try {
				const publicKey = await this.setPublicKey(keys.publicKey);
				try {
					await this.setPrivateKey(keys.privateKey);
					return ok({
						privateKey: keys.privateKey,
						publicKey,
					});
				} catch (error) {
					return err(new Error('Error setting private key', { cause: error }));
				}
			} catch (error) {
				return err(new Error('Error setting public key', { cause: error }));
			}
		} catch (error) {
			return err(new Error('Error creating and loading keys', { cause: error }));
		}
	}

	async loadKeysFromDB(): AsyncResult<RemoteKeyPair, Error> {
		try {
			return ok(await this.#service.fetchMyKeys());
		} catch (error) {
			return err(new Error('Error loading keys from service', { cause: error }));
		}
	}

	async persistKeys(localKeyPair: LocalKeyPair, password: string, force: boolean): AsyncResult<unknown, Error> {
		if (typeof localKeyPair.public_key !== 'string' || typeof localKeyPair.private_key !== 'string') {
			return err(new TypeError('Failed to persist keys as they are not strings.'));
		}

		const encodedPrivateKey = await this.encodePrivateKey(localKeyPair.private_key, password);
		if (!encodedPrivateKey.isOk) {
			return encodedPrivateKey;
		}

		return ok(
			await this.#service.persistKeys(
				{
					private_key: encodedPrivateKey.value,
					public_key: localKeyPair.public_key,
				},
				force,
			),
		);
	}

	async encodePrivateKey(privateKey: string, password: string): AsyncResult<string, Error> {
		const masterKey = await this.getMasterKey(password);
		if (!masterKey.isOk) {
			return masterKey;
		}
		const IV_LENGTH = 16;
		const vector = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
		try {
			const privateKeyBuffer = toArrayBuffer(privateKey);
			const encryptedPrivateKey = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, masterKey.value, privateKeyBuffer);
			const joined = joinVectorAndEncryptedData(vector, encryptedPrivateKey);
			const stringified = stringifyUint8Array(joined);
			return ok(stringified);
		} catch (error) {
			return err(new Error('Error encrypting encodedPrivateKey', { cause: error }));
		}
	}

	async decodePrivateKey(privateKey: string, password: string): AsyncResult<string, Error> {
		const masterKey = await this.getMasterKey(password);
		if (!masterKey.isOk) {
			return masterKey;
		}

		const [vector, cipherText] = splitVectorAndEncryptedData(parseUint8Array(privateKey));

		try {
			const privKey = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, masterKey.value, cipherText);
			return ok(toString(privKey));
		} catch (error) {
			return err(new Error('Error decrypting private key', { cause: error }));
		}
	}

	/// Low-level key management methods

	/**
	 * Sets the public key in the storage.
	 * @param key The public key to store.
	 */
	async setPublicKey(key: CryptoKey): Promise<JsonWebKey> {
		const exported = await crypto.subtle.exportKey('jwk', key);
		const stringified = JSON.stringify(exported);
		localStorage.setItem('public_key', stringified);
		return exported;
	}

	async setPrivateKey(key: CryptoKey): Promise<void> {
		const exported = await crypto.subtle.exportKey('jwk', key);
		const stringified = JSON.stringify(exported);
		localStorage.setItem('private_key', stringified);
	}

	async getMasterKey(password: string): AsyncResult<CryptoKey, Error> {
		if (!password) {
			return err(new Error('You should provide a password'));
		}

		// First, create a PBKDF2 "key" containing the password
		const baseKey = await (async () => {
			try {
				return ok(await importPbkdf2Key(password));
			} catch (error) {
				return err(new Error(`Error creating a key based on user password: ${error}`));
			}
		})();

		if (!baseKey.isOk) {
			return baseKey;
		}

		const userId = await this.#service.userId();

		if (!userId) {
			return err(new Error('User not found'));
		}

		// Derive a key from the password
		try {
			return ok(await deriveKeyWithPbkdf2(userId, baseKey.value));
		} catch (error) {
			return err(new Error(`Error deriving baseKey: ${error}`));
		}
	}

	getKeysFromLocalStorage(): LocalKeyPair {
		const public_key = localStorage.getItem('public_key');
		const private_key = localStorage.getItem('private_key');
		return {
			private_key,
			public_key,
		};
	}

	removeKeysFromLocalStorage(): void {
		localStorage.removeItem('public_key');
		localStorage.removeItem('private_key');
	}

	storeRandomPassword(randomPassword: string): void {
		return localStorage.setItem('e2e.random_password', randomPassword);
	}

	getRandomPassword(): string | null {
		return localStorage.getItem('e2e.random_password');
	}

	removeRandomPassword(): void {
		return localStorage.removeItem('e2e.random_password');
	}
	async createRandomPassword(length: number): Promise<string> {
		const randomPassword = await generateMnemonicPhrase(length);
		this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
