export interface KeyStorage {
	load(keyName: string): Promise<string | null>;
	store(keyName: string, value: string): Promise<void>;
	remove(keyName: string): Promise<void>;
}

export interface RandomGenerator {
	getRandomValues<T extends ArrayBufferView>(array: T): T;
}

export type KeyPair = {
	public_key: string | null;
	private_key: string | null;
};

export class E2EE {
	#storage: KeyStorage;
	#random: RandomGenerator;

	constructor(storage: KeyStorage, random: RandomGenerator) {
		this.#storage = storage;
		this.#random = random;
	}

	static fromWeb(storage: Storage, crypto: Crypto): E2EE {
		return new E2EE(
			{
				load: (keyName) => Promise.resolve(storage.getItem(keyName)),
				store: (keyName, value) => Promise.resolve(storage.setItem(keyName, value)),
				remove: (keyName) => Promise.resolve(storage.removeItem(keyName)),
			},
			{
				getRandomValues: (array) => crypto.getRandomValues(array),
			},
		);
	}

	async getKeysFromLocalStorage(): Promise<KeyPair> {
		return {
			public_key: await this.#storage.load('public_key'),
			private_key: await this.#storage.load('private_key'),
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
