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
			details?: any;
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

declare module 'meteor/rocketchat:tap-i18n' {
	namespace TAPi18n {
		function __(s: string, options: { lng: string }): string;
	}
}
