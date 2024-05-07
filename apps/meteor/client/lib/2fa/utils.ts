export const isTotpRequiredError = (
	error: unknown,
): error is Meteor.Error & ({ error: 'totp-required' } | { errorType: 'totp-required' }) =>
	typeof error === 'object' &&
	((error as { error?: unknown } | undefined)?.error === 'totp-required' ||
		(error as { errorType?: unknown } | undefined)?.errorType === 'totp-required');

export const isTotpInvalidError = (error: unknown): error is Meteor.Error & ({ error: 'totp-invalid' } | { errorType: 'totp-invalid' }) =>
	(error as { error?: unknown } | undefined)?.error === 'totp-invalid' ||
	(error as { errorType?: unknown } | undefined)?.errorType === 'totp-invalid';

export const isTotpMaxAttemptsError = (
	error: unknown,
): error is Meteor.Error & ({ error: 'totp-max-attempts' } | { errorType: 'totp-max-attempts' }) =>
	(error as { error?: unknown } | undefined)?.error === 'totp-max-attempts' ||
	(error as { errorType?: unknown } | undefined)?.errorType === 'totp-max-attempts';
