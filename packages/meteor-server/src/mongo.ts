import type { Collection, Db, Document } from 'mongodb';
import * as mongodb from 'mongodb';
import { MongoClient } from 'mongodb';

/**
 * Port of the meteor/mongo server surface Rocket.Chat actually uses: the
 * `MongoInternals.defaultRemoteCollectionDriver().mongo` handle exposing the
 * raw driver `db`/`client` (see apps/meteor/server/database/utils.ts).
 *
 * Rocket.Chat's models run on the raw driver already, so no minimongo/livedata
 * layer is provided. `Mongo.Collection` intentionally throws.
 */

/**
 * Meteor's `MongoInternals.Connection`. Rocket.Chat patches
 * `Connection.prototype._observeChanges` to replace Meteor's polling-based
 * observers with its own database listeners, so the class has to exist and be
 * the prototype of the object returned by `defaultRemoteCollectionDriver()`.
 */
export class Connection {
	public db: Db;

	public client: MongoClient;

	public _oplogHandle: { onOplogEntry?: unknown } | null = null;

	constructor(url: string) {
		// Construction is synchronous; the driver connects implicitly on first
		// operation. The entrypoint may `await connectToDatabase()` to fail fast.
		this.client = new MongoClient(url);
		this.db = this.client.db();
	}

	rawCollection(name: string): Collection<Document> {
		return this.db.collection(name);
	}

	rawDatabase(): Db {
		return this.db;
	}
}

export type MongoConnection = Connection;

let connection: Connection | undefined;

const createConnection = (): Connection => {
	const mongoUrl = process.env.MONGO_URL;
	if (!mongoUrl) {
		throw new Error('MONGO_URL must be set to use MongoInternals');
	}

	return new Connection(mongoUrl);
};

export const connectToDatabase = async (): Promise<MongoConnection> => {
	const conn = MongoInternals.defaultRemoteCollectionDriver().mongo;

	try {
		await conn.client.connect();
	} catch (err) {
		throw annotateConnectionError(err);
	}

	return conn;
};

/**
 * A replica set reports its members by the hostnames in its own config, and the
 * driver then talks to *those* rather than the seed we dialled. A Mongo started
 * by docker compose typically advertises the compose service name (`mongo:27017`),
 * which resolves inside the compose network but not on the host — so a URL that
 * looks perfectly reachable fails with an unresolvable hostname. The driver's
 * error does not explain this, so say it here.
 */
/** Hostnames from a mongodb:// URL's authority section, without ports or credentials */
const seedHosts = (url = ''): string[] => {
	const authority = /^mongodb(?:\+srv)?:\/\/([^/?]*)/.exec(url)?.[1];
	if (!authority) {
		return [];
	}

	return authority
		.slice(authority.lastIndexOf('@') + 1)
		.split(',')
		.map((host) => host.split(':')[0])
		.filter(Boolean);
};

const annotateConnectionError = (err: unknown): unknown => {
	const message = err instanceof Error ? err.message : String(err);
	const unresolvedHost = /getaddrinfo ENOTFOUND ([^\s]+)/.exec(JSON.stringify((err as { reason?: unknown })?.reason ?? '') + message)?.[1];

	if (!unresolvedHost) {
		return err;
	}

	// Compare against the seed's actual host list, not the whole URL — the
	// scheme ('mongodb://') would substring-match a host literally named 'mongo'.
	if (seedHosts(process.env.MONGO_URL).includes(unresolvedHost)) {
		// The seed host itself is wrong — the plain driver error is clear enough.
		return err;
	}

	return new Error(
		`Could not reach the replica set member '${unresolvedHost}' advertised by MONGO_URL.\n` +
			`The connection to the seed host succeeded, but replica set discovery replaced it with ` +
			`'${unresolvedHost}', which does not resolve from here (a docker compose Mongo usually ` +
			`advertises its service name).\n` +
			`Either add '?directConnection=true' to MONGO_URL and drop 'replicaSet', or make ` +
			`'${unresolvedHost}' resolvable.`,
		{ cause: err },
	);
};

export const MongoInternals = {
	Connection,

	defaultRemoteCollectionDriver(): { mongo: Connection } {
		connection ??= createConnection();
		return { mongo: connection };
	},

	NpmModules: {
		mongodb: {
			version: (mongodb as { version?: string }).version ?? 'unknown',
			module: mongodb,
		},
	},
};

export const Mongo = {
	Collection: class Collection {
		constructor(name?: string) {
			throw new Error(
				`Mongo.Collection('${name}') is not supported by @rocket.chat/meteor-server — use the raw driver via @rocket.chat/models instead`,
			);
		}
	},

	ObjectID: mongodb.ObjectId,
};
