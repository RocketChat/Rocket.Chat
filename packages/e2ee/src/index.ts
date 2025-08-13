export interface KeyStorage {
	load(keyName: string): Promise<string | null>;
	store(keyName: string, value: string): Promise<void>;
	remove(keyName: string): Promise<void>;
}

export interface KeyService {
	fetchMyKeys(): Promise<KeyPair>;
}

export interface RandomGenerator {
	getRandomValues<T extends ArrayBufferView>(array: T): T;
}

export type PrivateKey = string;
export type PublicKey = string;

export type KeyPair = {
	public_key: PublicKey;
	private_key: PrivateKey;
};

export class E2EE {
	#service: KeyService;
	#storage: KeyStorage;
	#random: RandomGenerator;

	constructor(storage: KeyStorage, random: RandomGenerator, service: KeyService) {
		this.#storage = storage;
		this.#random = random;
		this.#service = service;
	}

	async getKeysFromLocalStorage(): Promise<Partial<KeyPair>> {
		const public_key = (await this.#storage.load('public_key')) ?? undefined;
		const private_key = (await this.#storage.load('private_key')) ?? undefined;

		return {
			public_key,
			private_key,
		};
	}

	async getKeysFromService(): Promise<KeyPair> {
		const keys = await this.#service.fetchMyKeys();

		if (!keys) {
			throw new Error('Failed to retrieve keys from service');
		}

		return {
			public_key: keys.public_key,
			private_key: keys.private_key,
		};
	}

	async #generateMnemonicPhrase(n: number, sep = ' '): Promise<string> {
		const wordList = await import('./wordList.ts');
		const result = new Array(n);
		const randomBuffer = new Uint32Array(n);
		this.#random.getRandomValues(randomBuffer);
		for (let i = 0; i < n; i++) {
			result[i] = wordList.v1[randomBuffer[i]! % wordList.v1.length]!;
		}
		return result.join(sep);
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
		const randomPassword = await this.#generateMnemonicPhrase(5);
		this.storeRandomPassword(randomPassword);
		return randomPassword;
	}
}
