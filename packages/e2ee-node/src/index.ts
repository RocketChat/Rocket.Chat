import { E2EEBase, type KeyService, type KeyStorage } from '@rocket.chat/e2ee';
import { webcrypto } from 'node:crypto';

class MemoryStorage implements KeyStorage {
	private map = new Map<string, string>();

	load(keyName: string): Promise<string | null> {
		return Promise.resolve(this.map.get(keyName) ?? null);
	}
	store(keyName: string, value: string): Promise<void> {
		this.map.set(keyName, value);
		return Promise.resolve();
	}
	remove(keyName: string): Promise<void> {
		this.map.delete(keyName);
		return Promise.resolve();
	}
}

export class E2EE extends E2EEBase {
	constructor(keyStorage: KeyStorage, keyService: KeyService) {
		super(
			{
				getRandomValues(array) {
					return webcrypto.getRandomValues(array);
				},
			},
			keyStorage,
			keyService,
		);
	}

	static withMemoryStorage(keyService: KeyService): E2EE {
		const memoryStorage = new MemoryStorage();
		return new E2EE(memoryStorage, keyService);
	}
}
