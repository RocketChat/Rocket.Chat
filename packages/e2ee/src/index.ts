import { type AsyncResult, err, ok } from './result.ts';
import { joinVectorAndEncryptedData, splitVectorAndEncryptedData } from './vector.ts';
import { toArrayBuffer, toString } from './binary.ts';
import type { BaseKeyCodec } from './codec.ts';

export { BaseKeyCodec } from './codec.ts';

export interface KeyStorage {
	load(keyName: string): Promise<string | undefined | null>;
	store(keyName: string, value: string): Promise<void>;
	remove(keyName: string): Promise<boolean | void>;
}

export interface KeyService {
	userId: () => Promise<string | null>;
	fetchMyKeys: () => Promise<RemoteKeyPair>;
	persistKeys: (keys: RemoteKeyPair, force: boolean) => Promise<void | null>;
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

export abstract class BaseE2EE {
	#service: KeyService;
	#storage: KeyStorage;
	#codec: BaseKeyCodec;

	get codec(): BaseKeyCodec {
		return this.#codec;
	}

	constructor(codec: BaseKeyCodec, storage: KeyStorage, service: KeyService) {
		this.#storage = storage;
		this.#service = service;
		this.#codec = codec;
	}

	async loadKeys({ public_key, private_key }: RemoteKeyPair): AsyncResult<CryptoKey, Error> {
		try {
			const res = await this.#codec.crypto.importRsaDecryptKey(JSON.parse(private_key));
			await this.#storage.store('public_key', public_key);
			await this.#storage.store('private_key', private_key);
			return ok(res);
		} catch (error) {
			return err(new Error('Error loading keys', { cause: error }));
		}
	}

	async createAndLoadKeys(): AsyncResult<KeyPair, Error> {
		try {
			const keys = await this.#codec.crypto.generateRsaOaepKeyPair();
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
			return ok(await this.getKeysFromService());
		} catch (error) {
			return err(new Error('Error loading keys from service', { cause: error }));
		}
	}

	async persistKeys(localKeyPair: LocalKeyPair, password: string, force: boolean): AsyncResult<void | null, Error> {
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
		const vector = this.#codec.getRandomUint8Array(IV_LENGTH);
		try {
			const encodedPrivateKey = await this.#codec.crypto.encryptAesCbc(masterKey.value, vector, toArrayBuffer(privateKey));

			return ok(this.#codec.stringifyUint8Array(joinVectorAndEncryptedData(vector, encodedPrivateKey)));
		} catch (error) {
			return err(new Error('Error encrypting encodedPrivateKey', { cause: error }));
		}
	}

	async decodePrivateKey(privateKey: string, password: string): AsyncResult<string, Error> {
		const masterKey = await this.getMasterKey(password);
		if (!masterKey.isOk) {
			return masterKey;
		}

		const [vector, cipherText] = splitVectorAndEncryptedData(this.#codec.parseUint8Array(privateKey));

		try {
			const privKey = await this.#codec.crypto.decryptAesCbc(masterKey.value, vector, cipherText);
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
		const exported = await this.#codec.crypto.exportJsonWebKey(key);
		const stringified = JSON.stringify(exported);
		await this.#storage.store('public_key', stringified);
		return exported;
	}

	async setPrivateKey(key: CryptoKey): Promise<void> {
		const exported = await this.#codec.crypto.exportJsonWebKey(key);
		const stringified = JSON.stringify(exported);
		return this.#storage.store('private_key', stringified);
	}

	async getMasterKey(password: string): AsyncResult<CryptoKey, Error> {
		if (!password) {
			return err(new Error('You should provide a password'));
		}

		// First, create a PBKDF2 "key" containing the password
		const baseKey = await (async () => {
			try {
				return ok(await this.#codec.createBaseKey(password));
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
			return ok(await this.#codec.deriveKey(userId, baseKey.value));
		} catch (error) {
			return err(new Error(`Error deriving baseKey: ${error}`));
		}
	}

	async getKeysFromLocalStorage(): Promise<LocalKeyPair> {
		const public_key = await this.#storage.load('public_key');
		const private_key = await this.#storage.load('private_key');
		return {
			private_key,
			public_key,
		};
	}

	async removeKeysFromLocalStorage(): Promise<void> {
		await this.#storage.remove('public_key');
		await this.#storage.remove('private_key');
	}

	async getKeysFromService(): Promise<RemoteKeyPair> {
		const keys = await this.#service.fetchMyKeys();

		if (!keys) {
			throw new Error('Failed to retrieve keys from service');
		}

		return keys;
	}

	async storeRandomPassword(randomPassword: string): Promise<void> {
		await this.#storage.store('e2e.random_password', randomPassword);
	}

	getRandomPassword(): Promise<string | undefined | null> {
		return this.#storage.load('e2e.random_password');
	}

	removeRandomPassword(): Promise<boolean | void> {
		return this.#storage.remove('e2e.random_password');
	}
	async createRandomPassword(length: number): Promise<string> {
		const randomPassword = await this.#codec.generateMnemonicPhrase(length);
		await this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
