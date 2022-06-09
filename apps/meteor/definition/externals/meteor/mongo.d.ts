/* eslint-disable @typescript-eslint/interface-name-prefix */
import * as mongodb from 'mongodb';

declare module 'meteor/mongo' {
	interface RemoteCollectionDriver {
		mongo: MongoConnection;
	}

	interface OplogHandle {
		stop(): void;
		onOplogEntry(trigger: Record<string, any>, callback: Function): void;
		onSkippedEntries(callback: Function): void;
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
		// eslint-disable-next-line @typescript-eslint/interface-name-prefix
		interface CollectionStatic {
			new <T>(
				name: string | null,
				options?: {
					connection?: object | null;
					idGeneration?: string;
					transform?: Function | null;
				},
			): Collection<T>;
		}
	}
}
