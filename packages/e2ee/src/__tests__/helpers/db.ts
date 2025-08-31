import type { RemoteKeyPair } from '../..';

class Db<Data> {
	data: Map<string, Data>;
	constructor() {
		this.data = new Map();
	}

	async get(userId: string): Promise<Data> {
		return await new Promise((resolve, reject) => {
			const data = this.data.get(userId);
			setTimeout(() => {
				data ? resolve(data) : reject(new Error('User not found'));
			}, 100);
		});
	}

	async set(userId: string, data: Data, force: boolean): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			setTimeout(() => {
				if (this.data.has(userId)) {
					if (!force) {
						reject(new Error('User already exists'));
					} else {
						this.data.set(userId, data);
						resolve();
					}
				} else {
					this.data.set(userId, data);
					resolve();
				}
			}, 100);
		});
	}

	async update(userId: string, update: Partial<Data>): Promise<void> {
		const user = await this.get(userId);
		if (!user) {
			throw new Error('User not found');
		}
		this.data.set(userId, { ...user, ...update });
	}
}

export const createDb = (): Db<RemoteKeyPair> => new Db();
