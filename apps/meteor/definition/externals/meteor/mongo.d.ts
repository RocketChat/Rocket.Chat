import type * as mongodb from 'mongodb';

declare module 'meteor/mongo' {
	interface RemoteCollectionDriver {
		mongo: MongoConnection;
	}

	interface OplogHandle {
		stop(): void;
		onOplogEntry(trigger: Record<string, any>, callback: (notification: unknown) => void): void;
		onSkippedEntries(callback: () => void): void;
		waitUntilCaughtUp(): void;
		_defineTooFarBehind(value: number): void;
		_entryQueue?: unknown[];
	}

	interface MongoConnection {
		db: mongodb.Db;
		_oplogHandle: OplogHandle;
		rawCollection(name: string): mongodb.Collection;
	}

	namespace MongoInternals {
		function defaultRemoteCollectionDriver(): RemoteCollectionDriver;

		class ConnectionClass {}

		function Connection(): ConnectionClass;
	}

	namespace Mongo {
		interface CollectionStatic {
			new <T>(
				name: string | null,
				options?: {
					connection?: object | null;
					idGeneration?: string;
					transform?: (<T>(doc: T) => T) | null;
				},
			): Collection<T>;
		}
	}
}
