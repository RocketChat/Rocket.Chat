declare module 'meteor/accounts-base' {
	import type { Meteor } from 'meteor/meteor';

	namespace Accounts {
		const storageLocation: Window['localStorage'];

		function _expireTokens(oldestValidDate?: Date, userId?: string): Promise<void>;

		function _bcryptRounds(): number;

		function _getLoginToken(connectionId: string): string | undefined;

		function insertUserDoc(options: Record<string, any>, user: Record<string, any>): string;

		function _generateStampedLoginToken(): { token: string; when: Date };

		function _insertLoginToken(userId: string, token: { token: string; when: Date }): Promise<void>;

		function _runLoginHandlers<T>(methodInvocation: T, loginRequest: Record<string, any>): Promise<LoginMethodResult>;

		function registerLoginHandler(name: string, handler: (options: any) => undefined | object): void;

		function _setAccountData(connectionId: string, key: string, token: string): void;

		function _checkPasswordAsync(user: Meteor.User, password: Password): Promise<{ userId: string; error?: any }>;

		function updateOrCreateUserFromExternalService(
			serviceName: string,
			serviceData: Record<string, unknown>,
			options: Record<string, unknown>,
		): Promise<Record<string, unknown> | undefined>;

		function addAutopublishFields(options: Record<string, unknown>): void;

		function _clearAllLoginTokens(userId: string | null): void;

		function config(options: { clientStorage: 'session' | 'local' }): void;

		class LoginCancelledError extends Error {
			public static readonly numericError: number;
		}

		const _accountData: Record<string, any>;

		interface AccountsServerOptions {
			ambiguousErrorMessages?: boolean;
			restrictCreationByEmailDomain?: string | (() => string);
			forbidClientAccountCreation?: boolean | undefined;
		}

		export const _options: AccountsServerOptions;

		const connection: {
			userId(): string | null;
		};
	}
}
