declare module 'meteor/oauth' {
	import type { IRocketChatRecord } from '@rocket.chat/core-typings';
	import type { Mongo } from 'meteor/mongo';

	interface IOauthCredentials extends IRocketChatRecord {
		key: string;
		credentialSecret: string;
		credential:
			| {
					error: Error;
			  }
			| string;
	}

	namespace OAuth {
		function _retrievePendingCredential(key: string, ...args: string[]): void;
		function openSecret(secret: string): string;
		function retrieveCredential(credentialToken: string, credentialSecret: string);
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		const _pendingCredentials: Mongo.Collection<IOauthCredentials>;
		const _storageTokenPrefix: string;

		function launchLogin(options: {
			loginService: string;
			loginStyle: string;
			loginUrl: string;
			credentialRequestCompleteCallback?: (credentialTokenOrError?: string | Error) => void;
			credentialToken: string;
			popupOptions?: {
				width?: number;
				height?: number;
			};
		}): void;

		function _stateParam(loginStyle: string, credentialToken: string, redirectUrl?: string): string;

		function _redirectUri(
			serviceName: string,
			config: { loginStyle?: string },
			params?: Record<string, any>,
			absoluteUrlOptions?: Record<string, any>,
		): string;

		function _loginStyle(serviceName: string, config: { loginStyle?: string }, options?: Meteor.LoginWithExternalServiceOptions): string;
	}
}
