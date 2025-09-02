export interface KeychainState {
	userId: string;
	db: IDBDatabase;
}

export class Keychain {
	private state: KeychainState;

	constructor(state: KeychainState) {
		this.state = state;
	}

	public static async init(userId: string): Promise<Keychain> {
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open(`E2eeChatDB`, 1);
			request.onerror = (): void => reject(request.error);
			request.onsuccess = (): void => {
				resolve(request.result);
			};
			request.onupgradeneeded = (): void => {
				const db = request.result;
				if (!db.objectStoreNames.contains('CryptoKeys')) {
					db.createObjectStore('CryptoKeys', { keyPath: 'userId' });
				}
			};
		});

		return new Keychain({ userId, db });
	}

	private getState(): KeychainState {
		if (!this.state) {
			throw new Error('Keychain is not initialized.');
		}
		return this.state;
	}

	public async savePrivateKey(privateKey: CryptoKey): Promise<boolean> {
		const { db, userId } = this.getState();

		const res = await new Promise<boolean>((resolve, reject) => {
			const transaction = db.transaction('CryptoKeys', 'readwrite');
			const store = transaction.objectStore('CryptoKeys');
			const request = store.put({ userId, privateKey });
			request.onsuccess = (): void => {
				resolve(true);
			};
			request.onerror = (): void => {
				reject(new Error('Failed to save private key', { cause: request.error }));
			};
		});

		return res;
	}

	public async getPrivateKey(): Promise<CryptoKey | false> {
		const { db, userId } = this.getState();

		const privateKey = await new Promise<CryptoKey | false>((resolve, reject) => {
			const transaction = db.transaction('CryptoKeys', 'readonly');
			const store = transaction.objectStore('CryptoKeys');
			const request = store.get(userId);
			request.onsuccess = (): void => {
				resolve(request.result ? request.result.privateKey : false);
			};
			request.onerror = (): void => reject(new Error('Failed to get private key', { cause: request.error }));
		});

		return privateKey;
	}

	public async deletePrivateKey(): Promise<void> {
		const { db, userId } = this.getState();

		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('CryptoKeys', 'readwrite');
			const store = transaction.objectStore('CryptoKeys');
			const request = store.delete(userId);
			request.onsuccess = (): void => resolve();
			request.onerror = (): void => reject(new Error('Failed to delete private key', { cause: request.error }));
		});
	}
}
