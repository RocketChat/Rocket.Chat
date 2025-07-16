declare module 'meteor/oauth' {
	import type { IRocketChatRecord } from '@rocket.chat/core-typings';
	import type { Mongo } from 'meteor/mongo';

	// These functions may only be used on the client's Mongo.Collection
	type MeteorServerMongoCollection<T extends MongoNpmModule.Document, U = T> = Omit<
		Mongo.Collection<T, U>,
		'remove' | 'findOne' | 'insert' | 'update' | 'upsert'
	>;

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
		function _retrievePendingCredential(key: string, ...args: string[]): Promise<string | Error | void>;
		function openSecret(secret: string): string;
		function retrieveCredential(credentialToken: string, credentialSecret: string);
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		// luckily we don't have any reference to this collection on the client code, so let's type it according to what can be used on the server
		const _pendingCredentials: MeteorServerMongoCollection<IOauthCredentials>;
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
