import { IStreamer, IStreamerConstructor } from './modules/streamer/streamer.module';

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

		function _runLoginHandlers(methodInvocation: Function, loginRequest: Record<string, any>): Record<string, any> | undefined;

		export class ConfigError extends Error {}

		export class LoginCancelledError extends Error {
			public static readonly numericError: number;
		}
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
			details?: string | undefined | Record<string, string>;
		}

		const Streamer: IStreamerConstructor & IStreamer;

		const server: any;

		const runAsUser: (userId: string, scope: Function) => any;

		interface MethodThisType {
			twoFactorChecked: boolean | undefined;
		}
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
