/**
 * Amazon DocumentDB only supports one index build at a time per collection.
 * This patch serializes createIndex/createIndexes calls at the native
 * MongoDB driver level (app's node_modules/mongodb copy), covering calls
 * from Rocket.Chat models (BaseRaw) and EE microservices.
 *
 * Meteor packages (accounts-base, accounts-password) use a separate bundled
 * copy of the mongodb driver and are patched independently in the
 * rocketchat:mongo-config Meteor package via MongoConnection.
 *
 * Both patches share the same queue via a globalThis-keyed Map so builds
 * for the same collection are serialized across all code paths.
 *
 * Safe to import multiple times — the patch is applied only once.
 */
import { Collection } from 'mongodb';

const PATCHED = Symbol.for('rocketchat.documentdb.index.patch');
const QUEUE_KEY = Symbol.for('rocketchat.documentdb.index.queues');

if (process.env.DOCUMENTDB === 'true' && !(Collection as any)[PATCHED]) {
	(Collection as any)[PATCHED] = true;

	const g = globalThis as any;
	if (!g[QUEUE_KEY]) {
		g[QUEUE_KEY] = new Map<string, Promise<unknown>>();
	}
	const queues: Map<string, Promise<unknown>> = g[QUEUE_KEY];

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
