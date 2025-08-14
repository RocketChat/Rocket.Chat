import type { BaseKeyCodec } from './keyCodec.ts';

export { BaseKeyCodec } from './keyCodec.ts';

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
export type KeyPair = {
	public_key: PublicKey;
	private_key: PrivateKey;
};

export abstract class BaseE2EE {
	#service: KeyService;
	#storage: KeyStorage;
	#crypto: BaseKeyCodec;

	constructor(crypto: BaseKeyCodec, storage: KeyStorage, service: KeyService) {
		this.#storage = storage;
		this.#service = service;
		this.#crypto = crypto;
	}

	async getKeysFromLocalStorage(): Promise<Partial<KeyPair>> {
		const public_key = (await this.#storage.load('public_key')) ?? undefined;
		const private_key = (await this.#storage.load('private_key')) ?? undefined;
		return {
			...(public_key ? { public_key } : {}),
			...(private_key ? { private_key } : {}),
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

	async getRandomPassword(): Promise<string | null> {
		return this.#storage.load('e2e.random_password');
	}

	async removeRandomPassword(): Promise<void> {
		await this.#storage.remove('e2e.random_password');
	}

	async createRandomPassword(): Promise<string> {
		const randomPassword = await this.#crypto.generateMnemonicPhrase(5);
		this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
