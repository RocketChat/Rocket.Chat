
/* eslint-disable @typescript-eslint/interface-name-prefix */
declare module 'meteor/random' {
	namespace Random {
		function _randomString(numberOfChars: number, map: string): string;
	}
}

declare module 'meteor/mongo' {
	namespace MongoInternals {
		function defaultRemoteCollectionDriver(): any;
	}
}

declare module 'meteor/accounts-base' {
	namespace Accounts {
		function _bcryptRounds(): number;

		function _getLoginToken(connectionId: string): string | undefined;

		function insertUserDoc(options: Record<string, any>, user: Record<string, any>): string;

		function _generateStampedLoginToken(): {token: string; when: Date};
	}
}

interface IConnection {
	id: string;
	close: Function;
	onClose: Function;
	clientAddress: string;
	httpHeaders: Record<string, any>;
	metadata: Record<string, any>;
}

declare module 'meteor/meteor' {
	type globalError = Error;
	namespace Meteor {
		interface ErrorStatic {
			new (error: string | number, reason?: string, details?: any): Error;
		}
		interface Error extends globalError {
			error: string | number;
			reason?: string;
			details?: string | undefined | Record<string, string>;
		}

		const Streamer: import('./modules/streamer/streamer.module').IStreamerConstructor;

		const server: any;

		const runAsUser: (userId: string, scope: Function) => any;

		interface MethodThisType {
			twoFactorChecked: boolean | undefined;
		}

		type Connection = IConnection;

		interface User {
			_id: string;
			username?: string;
			emails?: UserEmail[];
			createdAt?: Date;
			profile?: any;
			services?: any;
			status?: string;
			statusDefault?: string;
		}
	}
}

declare module 'meteor/accounts' {
	namespace Accounts {
		function onLogin(callback: (login: {user: {_id: string}; connection: IConnection}) => void): void;
		function onLogout(callback: (login: {user: {_id: string}; connection: IConnection}) => void): void;
	}
}

declare module 'meteor/ddp-common' {
	namespace DDPCommon {
		function stringifyDDP(msg: import('meteor/ejson').EJSON): string;
		function parseDDP(msg: string): import('meteor/ejson').EJSON;
	}
}

declare module 'meteor/routepolicy' {
	export class RoutePolicy {
		static declare(urlPrefix: string, type: string): void;
	}
}

declare module 'meteor/rocketchat:tap-i18n' {
	namespace TAPi18n {
		function __(s: string, options: { lng: string }): string;
	}
}

declare module 'meteor/promise' {
	namespace Promise {
		function await(): any;
	}
}

declare module 'meteor/littledata:synced-cron' {
	interface ICronAddParameters {
		name: string;
		schedule: Function;
		job: Function;
	}
	namespace SyncedCron {
		function add(params: ICronAddParameters): string;
		function remove(name: string): string;
	}
}

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
	}
	interface MongoConnection {
		db: import('mongodb').Db;
		_oplogHandle: OplogHandle;
		rawCollection(name: string): import('mongodb').Collection;
	}

	namespace MongoInternals {
		function defaultRemoteCollectionDriver(): RemoteCollectionDriver;

		class ConnectionClass {}

		function Connection(): ConnectionClass;
	}
}

declare module 'async_hooks' {
	export class AsyncLocalStorage<T> {
		disable(): void;

		getStore(): T | undefined;

		run(store: T, callback: (...args: any[]) => void, ...args: any[]): void;

		exit(callback: (...args: any[]) => void, ...args: any[]): void;

		runSyncAndReturn<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;

		exitSyncAndReturn<R>(callback: (...args: any[]) => R, ...args: any[]): R;

		enterWith(store: T): void;
	}
}
