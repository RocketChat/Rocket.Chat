import { type Optional, type Result, err, ok } from './utils.ts';
import { joinVectorAndEncryptedData, splitVectorAndEncryptedData } from './vector.ts';
import { toArrayBuffer, toString } from './binary.ts';
import type { BaseKeyCodec } from './codec.ts';

export { BaseKeyCodec } from './codec.ts';

export interface KeyStorage {
	load(keyName: string): Promise<string | null>;
	store(keyName: string, value: string): Promise<void>;
	remove(keyName: string): Promise<void>;
}

export interface KeyService {
	userId: () => Promise<string | null>;
	fetchMyKeys: () => Promise<KeyPair>;
}

export type PrivateKey = string;
export type PublicKey = string;

export interface KeyPair {
	public_key: PublicKey;
	private_key: PrivateKey;
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

	async loadKeys(
		{ public_key, private_key }: { public_key: string; private_key: string },
		callbacks: {
			onSuccess: (privateKey: CryptoKey) => void;
			onError: (error: unknown) => void;
			parse: (data: string) => object;
		},
	): Promise<void> {
		await this.#storage.store('public_key', public_key);
		try {
			callbacks.onSuccess(await this.codec.crypto.importRsaDecryptKey(callbacks.parse(private_key)));

			await this.#storage.store('private_key', private_key);
		} catch (error) {
			callbacks.onError(error);
		}
	}

	async createAndLoadKeys(callbacks: {
		onPrivateKey: (privateKey: CryptoKey) => void;
		onPublicKey: (publicKey: JsonWebKey) => void;
		onError: (error: unknown) => void;
	}): Promise<void> {
		// Could not obtain public-private keypair from server.
		try {
			const keys = await this.#codec.crypto.generateRsaOaepKeyPair();
			callbacks.onPrivateKey(keys.privateKey);
			try {
				await this.setPublicKey(keys.publicKey);
				const publicKey = await this.#codec.crypto.exportJsonWebKey(keys.publicKey);
				callbacks.onPublicKey(publicKey);
				try {
					await this.setPrivateKey(keys.privateKey);
				} catch (error) {
					callbacks.onError(error);
					return;
				}
			} catch (error) {
				callbacks.onError(error);
				return;
			}
		} catch (error) {
			callbacks.onError(error);
			return;
		}
	}

	async loadKeysFromDB(callbacks: { onSuccess: (keys: KeyPair) => void; onError: (error: unknown) => void }): Promise<void> {
		try {
			callbacks.onSuccess(await this.getKeysFromService());
		} catch (error) {
			callbacks.onError(error);
		}
	}

	async encodePrivateKey(privateKey: string, password: string): Promise<Result<string, Error>> {
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

	async decodePrivateKey(privateKey: string, password: string): Promise<Result<string, Error>> {
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
	async setPublicKey(key: CryptoKey): Promise<void> {
		const exported = await this.#codec.crypto.exportJsonWebKey(key);
		const stringified = JSON.stringify(exported);
		return this.#storage.store('public_key', stringified);
	}

	async setPrivateKey(key: CryptoKey): Promise<void> {
		const exported = await this.#codec.crypto.exportJsonWebKey(key);
		const stringified = JSON.stringify(exported);
		return this.#storage.store('private_key', stringified);
	}

	async getMasterKey(password: string): Promise<Result<CryptoKey, Error>> {
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

	async getKeysFromLocalStorage(): Promise<Optional<KeyPair>> {
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

	async getKeysFromService(): Promise<KeyPair> {
		const keys = await this.#service.fetchMyKeys();

		if (!keys) {
			throw new Error('Failed to retrieve keys from service');
		}

		return keys;
	}

	async storeRandomPassword(randomPassword: string): Promise<void> {
		await this.#storage.store('e2e.random_password', randomPassword);
	}

	getRandomPassword(): Promise<string | null> {
		return this.#storage.load('e2e.random_password');
	}

	removeRandomPassword(): Promise<void> {
		return this.#storage.remove('e2e.random_password');
	}
	async createRandomPassword(length: number): Promise<string> {
		const randomPassword = await this.#codec.generateMnemonicPhrase(length);
		await this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
