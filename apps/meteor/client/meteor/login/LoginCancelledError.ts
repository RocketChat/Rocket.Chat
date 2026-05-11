// Mirrors Meteor's `Accounts.LoginCancelledError` so the OAuth login flow can
// detect server-issued cancellation errors (Meteor.Error.error === numericError)
// without importing from meteor/accounts-base.
export class LoginCancelledError extends Error {
	static readonly numericError = 0x8acdc2f;

	constructor(reason?: string) {
		super(reason);
		this.name = 'Accounts.LoginCancelledError';
	}
}
