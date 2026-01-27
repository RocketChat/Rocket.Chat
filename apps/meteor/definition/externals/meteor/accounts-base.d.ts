import type { Meteor } from 'meteor/meteor';

declare module 'meteor/accounts-base' {
	type UserToActivateOptions = {
		name?: string;
		email?: string;
		reason?: string;
	};

	type UserActivatedOptions = {
		active: boolean;
		username?: string;
		name: string;
	};

	interface EmailTemplates {
		userToActivate: {
			subject(options?: UserToActivateOptions): string;
			html(options?: UserToActivateOptions): string;
		};
		userActivated: {
			subject(options: UserActivatedOptions): string;
			html(options: UserActivatedOptions): string;
		};
	}

	namespace Accounts {
		const storageLocation: Window['localStorage'];
		function createUser(
			options: {
				username?: string;
				email?: string;
				password?: string;
				profile?: Record<string, unknown>;
				joinDefaultChannelsSilenced?: boolean;
				skipEmailValidation?: boolean;
			},
			callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void,
		): string;

		function _bcryptRounds(): number;

		function _getLoginToken(connectionId: string): string | undefined;

		function insertUserDoc(options: Record<string, any>, user: Partial<Meteor.User> & { globalRoles?: string[] }): Promise<string>;

		function _generateStampedLoginToken(): { token: string; when: Date };

		function _insertLoginToken(userId: string, token: { token: string; when: Date }): void;

		function _runLoginHandlers<T>(methodInvocation: T, loginRequest: Record<string, any>): Promise<LoginMethodResult>;

		function registerLoginHandler(name: string, handler: (options: any) => undefined | object): void;

		function _storedLoginToken(): unknown;

		function _unstoreLoginToken(): void;

		function _setAccountData(connectionId: string, key: string, token: string): void;

		function _checkPasswordAsync(user: Meteor.User, password: Password): Promise<{ userId: string; error?: any }>;

		function updateOrCreateUserFromExternalService(
			serviceName: string,
			serviceData: Record<string, unknown>,
			options: Record<string, unknown>,
		): Record<string, unknown>;

		function _clearAllLoginTokens(userId: string | null): void;

		function config(options: { clientStorage: 'session' | 'local' }): void;

		class ConfigError extends Error {}

		class LoginCancelledError extends Error {
			public static readonly numericError: number;
		}

		const USER_ID_KEY: string;

		const LOGIN_TOKEN_KEY: string;

		const _accountData: Record<string, any>;

		interface AccountsServerOptions {
			ambiguousErrorMessages?: boolean;
			restrictCreationByEmailDomain?: string | (() => string);
			forbidClientAccountCreation?: boolean;
			loginExpirationInDays?: number;
		}

		export const _options: AccountsServerOptions;

		// eslint-disable-next-line @typescript-eslint/no-namespace
		namespace oauth {
			function credentialRequestCompleteHandler(
				callback?: (error?: globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
				totpCode?: string,
			): (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void;

			function registerService(name: string): void;

			function serviceNames(): string[];
		}

		const connection: {
			userId(): string | null;
		};

		const _defaultPublishFields: {
			projection: Record<string, unknown>;
		};
	}
}
