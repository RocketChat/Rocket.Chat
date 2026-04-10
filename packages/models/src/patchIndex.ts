/**
 * Amazon DocumentDB only supports one index build at a time per collection.
 * This patch serializes all createIndex/createIndexes calls per collection
 * so concurrent index creation from Meteor packages (accounts-base,
 * accounts-password, accounts-oauth) and Rocket.Chat models (BaseRaw)
 * don't race against each other.
 *
 * Patching at the native MongoDB driver level ensures every call path is covered.
 *
 * Safe to import multiple times — the patch is applied only once.
 */
import { Collection } from 'mongodb';

const PATCHED = Symbol.for('rocketchat.documentdb.index.patch');

if (process.env.DOCUMENTDB === 'true' && !(Collection as any)[PATCHED]) {
	(Collection as any)[PATCHED] = true;

	const queues = new Map<string, Promise<unknown>>();

	const enqueue = <T>(collectionName: string, fn: () => Promise<T>): Promise<T> => {
		const prev = queues.get(collectionName) ?? Promise.resolve();
		const next = prev.then(fn, fn);
		queues.set(
			collectionName,
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			next.catch(() => {}),
		);
		return next;
	};

	const originalCreateIndex = Collection.prototype.createIndex;
	Collection.prototype.createIndex = function (this: Collection, ...args: Parameters<Collection['createIndex']>) {
		return enqueue(this.collectionName, () => originalCreateIndex.apply(this, args));
	} as typeof Collection.prototype.createIndex;

	const originalCreateIndexes = Collection.prototype.createIndexes;
	Collection.prototype.createIndexes = function (this: Collection, ...args: Parameters<Collection['createIndexes']>) {
		return enqueue(this.collectionName, () => originalCreateIndexes.apply(this, args));
	} as typeof Collection.prototype.createIndexes;
}
