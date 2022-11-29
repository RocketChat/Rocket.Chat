declare module 'meteor/accounts-base' {
	namespace Accounts {
		function createUser(
			options: {
				username?: string;
				email?: string;
				password?: string;
				profile?: Record<string, unknown>;
				joinDefaultChannelsSilenced?: boolean;
			},
			callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void,
		): string;

		function _bcryptRounds(): number;

		function _getLoginToken(connectionId: string): string | undefined;

		function insertUserDoc(options: Record<string, any>, user: Record<string, any>): string;

		function _generateStampedLoginToken(): { token: string; when: Date };

		function _insertLoginToken(userId: string, token: { token: string; when: Date }): void;

		function _runLoginHandlers<T>(methodInvocation: T, loginRequest: Record<string, any>): Record<string, any> | undefined;

		function updateOrCreateUserFromExternalService(
			serviceName: string,
			serviceData: Record<string, unknown>,
			options: Record<string, unknown>,
		): Record<string, unknown>;

		export class ConfigError extends Error {}

		export class LoginCancelledError extends Error {
			public static readonly numericError: number;
		}

		export const USER_ID_KEY: string;

		export const LOGIN_TOKEN_KEY: string;
	}
}
