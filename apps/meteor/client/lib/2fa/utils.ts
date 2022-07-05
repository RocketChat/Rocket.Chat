import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

export const isTotpRequiredError = (
	error: unknown,
): error is Meteor.Error & ({ error: 'totp-required' } | { errorType: 'totp-required' }) =>
	typeof error === 'object' &&
	((error as { error?: unknown } | undefined)?.error === 'totp-required' ||
		(error as { errorType?: unknown } | undefined)?.errorType === 'totp-required');

export const isTotpInvalidError = (error: unknown): error is Meteor.Error & ({ error: 'totp-invalid' } | { errorType: 'totp-invalid' }) =>
	(error as { error?: unknown } | undefined)?.error === 'totp-invalid' ||
	(error as { errorType?: unknown } | undefined)?.errorType === 'totp-invalid';

export const isLoginCancelledError = (error: unknown): error is Meteor.Error =>
	error instanceof Meteor.Error && error.error === Accounts.LoginCancelledError.numericError;

export const reportError = <T>(error: T, callback?: (error?: T) => void): void => {
	if (callback) {
		callback(error);
		return;
	}

	throw error;
};

export const convertError = <T>(error: T): Accounts.LoginCancelledError | T => {
	if (isLoginCancelledError(error)) {
		return new Accounts.LoginCancelledError(error.reason);
	}

	return error;
};
