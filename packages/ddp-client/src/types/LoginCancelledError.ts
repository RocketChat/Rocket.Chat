// Mirrors `Accounts.LoginCancelledError` from meteor/accounts-base.
// Thrown when the user cancels the login process (closes an OAuth popup,
// declines biometric auth, etc).
//
// `numericError` is the magic number Meteor uses to transmit this specific
// subclass over the DDP wire (the `error` field of a Meteor.Error is set to
// 0x8acdc2f when this happens). Callers check it via
// `error instanceof Meteor.Error && error.error === LoginCancelledError.numericError`.
// Keeping the same numeric value preserves cross-package compatibility while
// the Meteor accounts-base package is still loaded server-side.
export class LoginCancelledError extends Error {
	public static readonly numericError = 0x8acdc2f;

	public readonly error = LoginCancelledError.numericError;

	constructor(description?: string) {
		super(description);
		this.name = 'Accounts.LoginCancelledError';
	}
}
