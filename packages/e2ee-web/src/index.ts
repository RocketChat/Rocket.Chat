import { BaseE2EE, type KeyService, type KeyStorage } from '@rocket.chat/e2ee';
import KeyCodec from './codec.ts';

export default class WebE2EE extends BaseE2EE {
	constructor(keyStorage: KeyStorage, keyService: KeyService) {
		super(new KeyCodec(), keyStorage, keyService);
	}

	static withMemoryStorage(keyService: KeyService): WebE2EE {
		const map = new Map<string, string>();
		const memoryStorage: KeyStorage = {
			load: (keyName) => Promise.resolve(map.get(keyName)),
			remove: (keyName: string) => Promise.resolve(map.delete(keyName)),
			store: (keyName: string, value: string): Promise<void> => {
				map.set(keyName, value);
				return Promise.resolve();
			},
		};
		return new WebE2EE(memoryStorage, keyService);
	}

	static withLocalStorage(keyService: KeyService, storage: Storage = globalThis.localStorage): WebE2EE {
		const localStorage: KeyStorage = {
			load: (keyName) => {
				const item = storage.getItem(keyName);
				return Promise.resolve(item);
			},
			remove: (keyName) => Promise.resolve(storage.removeItem(keyName)),
			store: (keyName: string, value: string): Promise<void> => {
				storage.setItem(keyName, value);
				return Promise.resolve();
			},
		};
		return new WebE2EE(localStorage, keyService);
	}
}
