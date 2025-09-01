export class Keychain {
	private db: { userId: string; db: IDBDatabase } | false;

	constructor() {
		this.db = false;
	}

	public init(userId: string): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(`E2eeChatDB_${userId}`, 1);
			request.onerror = (): void => reject(request.error);
			request.onsuccess = (): void => {
				this.db = { userId, db: request.result };
				resolve(request.result);
			};
			request.onupgradeneeded = (): void => {
				const db = request.result;
				if (!db.objectStoreNames.contains('CryptoKeys')) {
					db.createObjectStore('CryptoKeys', { keyPath: 'userId' });
				}
			};
		});
	}

	private getDb(): { userId: string; db: IDBDatabase } {
		if (!this.db) {
			throw new Error('Keychain is not initialized.');
		}
		return this.db;
	}

	public async savePrivateKey(privateKey: CryptoKey): Promise<boolean> {
		const { userId, db } = await this.getDb();

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
		const { db, userId } = await this.getDb();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction('CryptoKeys', 'readonly');
			const store = transaction.objectStore('CryptoKeys');
			const request = store.get(userId);
			request.onsuccess = (): void => {
				resolve(request.result ? request.result.privateKey : false);
			};
			request.onerror = (): void => reject(new Error('Failed to get private key', { cause: request.error }));
		});
	}

	public async deletePrivateKey(): Promise<void> {
		const { db, userId } = await this.getDb();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('CryptoKeys', 'readwrite');
			const store = transaction.objectStore('CryptoKeys');
			const request = store.delete(userId);
			request.onsuccess = (): void => resolve();
			request.onerror = (): void => reject(new Error('Failed to delete private key', { cause: request.error }));
		});
	}
}
