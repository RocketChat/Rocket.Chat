import { BaseE2EE, type KeyService, type KeyStorage } from '@rocket.chat/e2ee';
import NodeKeyCodec from './codec.ts';

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

export default class NodeE2EE extends BaseE2EE {
	constructor(keyStorage: KeyStorage, keyService: KeyService) {
		super(new NodeKeyCodec(), keyStorage, keyService);
	}

	static withMemoryStorage(keyService: KeyService): NodeE2EE {
		const memoryStorage = new MemoryStorage();
		return new NodeE2EE(memoryStorage, keyService);
	}
}
