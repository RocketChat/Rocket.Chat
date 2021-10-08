import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

export const isTotpRequiredError = <T>(error: T): error is T & { error: 'totp-required' } =>
	(error as T & { error: unknown })?.error === 'totp-required';

export const isTotpInvalidError = <T>(error: T): error is T & { error: 'totp-invalid' } =>
	(error as T & { error: unknown })?.error === 'totp-invalid';

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
