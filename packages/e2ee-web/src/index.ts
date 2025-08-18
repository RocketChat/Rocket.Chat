import { BaseE2EE, type KeyService, type KeyStorage } from '@rocket.chat/e2ee';
import KeyCodec from './codec.ts';

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

class LocalStorage implements KeyStorage {
	load(keyName: string): Promise<string | null> {
		return Promise.resolve(localStorage.getItem(keyName));
	}
	store(keyName: string, value: string): Promise<void> {
		localStorage.setItem(keyName, value);
		return Promise.resolve();
	}
	remove(keyName: string): Promise<void> {
		localStorage.removeItem(keyName);
		return Promise.resolve();
	}
}

export default class WebE2EE extends BaseE2EE {
	constructor(keyStorage: KeyStorage, keyService: KeyService) {
		super(new KeyCodec(), keyStorage, keyService);
	}

	static withMemoryStorage(keyService: KeyService): WebE2EE {
		const memoryStorage = new MemoryStorage();
		return new WebE2EE(memoryStorage, keyService);
	}

	static withLocalStorage(keyService: KeyService): WebE2EE {
		const localStorage = new LocalStorage();
		return new WebE2EE(localStorage, keyService);
	}
}
