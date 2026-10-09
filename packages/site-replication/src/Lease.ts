import { randomUUID } from 'crypto';

import { MongoServerError } from 'mongodb';

import type { Store } from './store';

/** Elects one replicator per site among the server instances sharing its database. */
export class Lease {
	readonly owner = randomUUID();

	constructor(
		private readonly store: Store,
		private readonly ttlMs: number,
	) {}

	/** Takes or renews the lease; true while this instance holds it. */
	async acquire(): Promise<boolean> {
		const now = new Date();
		try {
			const result = await this.store.state.findOneAndUpdate(
				{ _id: 'leader', $or: [{ owner: this.owner }, { expiresAt: { $lt: now } }] } as never,
				{ $set: { owner: this.owner, expiresAt: new Date(now.getTime() + this.ttlMs) } },
				{ upsert: true, returnDocument: 'after' },
			);
			return (result as { owner?: string } | null)?.owner === this.owner;
		} catch (err) {
			if (err instanceof MongoServerError && err.code === 11000) {
				return false;
			}
			throw err;
		}
	}

	async release(): Promise<void> {
		await this.store.state.deleteOne({ _id: 'leader', owner: this.owner } as never);
	}
}
