declare module 'meteor/accounts-base' {
	namespace Accounts {
		function _bcryptRounds(): number;

		function _getLoginToken(connectionId: string): string | undefined;

		function insertUserDoc(options: Record<string, any>, user: Record<string, any>): string;

		function _generateStampedLoginToken(): { token: string; when: Date };

		function _insertLoginToken(userId: string, token: { token: string; when: Date }): void;

		function _runLoginHandlers(methodInvocation: Function, loginRequest: Record<string, any>): Record<string, any> | undefined;

		export class ConfigError extends Error {}

		export class LoginCancelledError extends Error {
			public static readonly numericError: number;
		}
	}
}
