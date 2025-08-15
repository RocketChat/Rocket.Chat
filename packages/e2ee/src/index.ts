import type { BaseKeyCodec } from './codec.ts';
import type { Optional } from './utils.ts';

export { BaseKeyCodec } from './codec.ts';

export interface KeyStorage {
	load(keyName: string): Promise<string | null>;
	store(keyName: string, value: string): Promise<void>;
	remove(keyName: string): Promise<void>;
}

export interface KeyService {
	fetchMyKeys(): Promise<KeyPair>;
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
	#crypto: BaseKeyCodec;

	constructor(crypto: BaseKeyCodec, storage: KeyStorage, service: KeyService) {
		this.#storage = storage;
		this.#service = service;
		this.#crypto = crypto;
	}

	async getKeysFromLocalStorage(): Promise<Optional<KeyPair>> {
		const public_key = await this.#storage.load('public_key');
		const private_key = await this.#storage.load('private_key');
		return {
			private_key,
			public_key,
		};
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
		const randomPassword = await this.#crypto.generateMnemonicPhrase(length);
		this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
