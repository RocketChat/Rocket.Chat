declare module 'meteor/oauth' {
	import { Mongo } from 'meteor/mongo';
	import { IRocketChatRecord } from '@rocket.chat/core-typings';

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
		function _redirectUri(serviceName: string, config: any, params: any, absoluteUrlOptions: any): string;
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		function _retrievePendingCredential(key: string, ...args: string[]): void;
		function openSecret(secret: string): string;
		const _storageTokenPrefix: string;
		const _pendingCredentials: Mongo.Collection<IOauthCredentials>;
	}
}
