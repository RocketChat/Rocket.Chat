const twoFactorMethods = ['totp', 'email', 'password'] as const;

export type TwoFactorMethod = (typeof twoFactorMethods)[number];

const INVALID_TOTP = 'totp-invalid';
const REQUIRED_TOTP = 'totp-required';
const MAX_ATTEMPTS_TOTP = 'totp-max-attempts';

type TwoFactorErrorTypes = typeof INVALID_TOTP | typeof REQUIRED_TOTP | typeof MAX_ATTEMPTS_TOTP;
type TwoFactorError<T extends TwoFactorErrorTypes> = {
	details: { method: TwoFactorMethod; emailOrUsername?: string };
} & ({ error: T } | { errorType: T });

export type TwoFactorErrorResponse = TwoFactorError<TwoFactorErrorTypes>;

const isTotpError = <TErrorType extends TwoFactorErrorTypes>(error: unknown, type: TErrorType): error is TwoFactorError<TErrorType> => {
	if (typeof error !== 'object' || error === null) {
		return false;
	}

	if ('error' in error && error.error === type) {
		return true;
	}

	if ('errorType' in error && error.errorType === type) {
		return true;
	}

	return false;
};

export const isTotpRequiredError = (error: unknown) => isTotpError(error, REQUIRED_TOTP);

export const isTotpInvalidError = (error: unknown) => isTotpError(error, INVALID_TOTP);

export const isTotpMaxAttemptsError = (error: unknown) => isTotpError(error, MAX_ATTEMPTS_TOTP);

export const isTwoFactorMethod = (method: string): method is TwoFactorMethod => twoFactorMethods.includes(method as TwoFactorMethod);

export const hasRequiredTwoFactorMethod = (error: unknown): error is { details: { method: TwoFactorMethod; emailOrUsername?: string } } => {
	const details = error && typeof error === 'object' && 'details' in error && error.details;
	return (
		typeof details === 'object' &&
		details !== null &&
		typeof (details as { method: unknown }).method === 'string' &&
		isTwoFactorMethod((details as { method: string }).method)
	);
};
