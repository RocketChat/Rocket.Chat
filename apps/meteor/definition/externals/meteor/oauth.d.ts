declare module 'meteor/oauth' {
	import type { IRocketChatRecord } from '@rocket.chat/core-typings';
	import type { Meteor } from 'meteor/meteor';
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
		function retrieveCredential(credentialToken: string, credentialSecret: string): unknown;
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		// luckily we don't have any reference to this collection on the client code, so let's type it according to what can be used on the server
		const _pendingCredentials: MeteorServerMongoCollection<IOauthCredentials>;
		const _storageTokenPrefix: string;

		function _redirectUri(
			serviceName: string,
			config: { loginStyle?: string },
			params?: Record<string, any>,
			absoluteUrlOptions?: Record<string, any>,
		): string;

		function _loginStyle(serviceName: string, config: { loginStyle?: string }, options?: Meteor.LoginWithExternalServiceOptions): string;

		// server-side only
		function registerService(
			serviceName: string,
			version: number,
			options: Record<string, any> | null,
			handler: (query: Record<string, any>) => Promise<any>,
		): void;

		function _fetch(url: string, method: 'GET' | 'POST', options?: Record<string, any>): Promise<Response>;

		function _stateFromQuery(query: Record<string, any>): Record<string, any> | null;

		function sealSecret(secret: string): string;

		function _addValuesToQueryParams(params: Record<string, any>): URLSearchParams;

		interface OAuthBinding {
			accessToken: string;
			accessTokenSecret: string;
		}

		function _queryParamsWithAuthTokenUrl(
			url: string,
			oauthBinding: OAuthBinding,
			params: Record<string, any>,
			validParams: string[],
		): string;

		function _endOfPopupResponseTemplate(): Promise<string>;
		function _endOfRedirectResponseTemplate(): Promise<string>;
		function _endOfLoginResponse(res: any, options: any): Promise<void>;
		function _checkRedirectUrlOrigin(redirectUrl: string): boolean;
		function _isCordovaFromQuery(query: Record<string, any>): boolean;
	}
}
