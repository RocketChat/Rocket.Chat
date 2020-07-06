import { EJSON } from 'meteor/ejson';

/* eslint-disable @typescript-eslint/interface-name-prefix */
declare module 'meteor/random' {
	namespace Random {
		function _randomString(numberOfChars: number, map: string): string;
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

declare module 'meteor/meteor' {
	type globalError = Error;
	namespace Meteor {
		interface ErrorStatic {
			new (error: string | number, reason?: string, details?: any): Error;
		}
		interface Error extends globalError {
			error: string | number;
			reason?: string;
			details?: string | undefined;
		}

		const server: any;

		interface MethodThisType {
			twoFactorChecked: boolean | undefined;
		}
	}
}

declare module 'meteor/ddp-common' {
	namespace DDPCommon {
		function stringifyDDP(msg: EJSON): string;
		function parseDDP(msg: string): EJSON;
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
