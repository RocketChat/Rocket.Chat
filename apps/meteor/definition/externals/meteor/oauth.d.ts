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

	interface IOAuth1BindingConstructor {
		new (config, urls): IOAuth1Binding;
	}

	type HandledOauthRequest = { serviceData: Record<string, any>; options?: Record<string, any> } | null;

	interface IOAuth1Binding {
		accessToken: string | string[];
		accessTokenSecret: string | string[];

		prepareRequestToken(callbackUrl: string): void;
		getAsync(
			url: string,
			params?: Record<string, any>,
			callback?: unknown,
		): Promise<{
			content: string;
			data: Record<string, any>;
			headers: Record<string, string>;
			redirected: boolean;
			ok: boolean;
			statusCode: number;
		}>;
	}

	interface IOAuth1Urls {
		requestToken: string | ((oauthBinding: IOAuth1Binding) => string);
		authorize: string | ((oauthBinding: IOAuth1Binding) => string);
		accessToken: string | ((oauthBinding: IOAuth1Binding) => string);
		authenticate: string | ((oauthBinding: IOAuth1Binding, authParams: Record<string, any>) => string);
	}

	namespace OAuth {
		function _retrievePendingCredential(key: string, ...args: string[]): Promise<string | Error | void>;
		function openSecret(secret: string): string;
		function sealSecret<T extends Record<string, any> | string | string[]>(
			secret: T,
		): T | { iv: string; ciphertext: string; algorithm: string; authTag: string };
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

		function registerService(
			name: string,
			version: 1,
			urls: IOAuth1Urls,
			handleOauthRequest: (binding: IOAuth1Binding, query?: Record<string, any>) => Promise<HandledOauthRequest>,
		): void;
		function registerService(
			name: string,
			version: 2,
			urls: null,
			handleOauthRequest: (query: Record<string, any>) => Promise<HandledOauthRequest>,
		): void;
		function registerService(
			name: string,
			version: 1 | 2,
			urls: IOAuth1Urls | null,
			handleOauthRequest:
				| ((binding: IOAuth1Binding, query?: Record<string, any>) => Promise<HandledOauthRequest>)
				| ((query: Record<string, any>) => Promise<HandledOauthRequest>),
		): void;

		function _queryParamsWithAuthTokenUrl(
			authUrl: string,
			oauthBinding: IOAuth1Binding,
			params: Record<string, any>,
			whitelistedQueryParams: string[],
		): string;

		function _fetch(url: string, method: 'GET' | 'POST', options: Record<string, any>): Promise<Response>;
	}
}
