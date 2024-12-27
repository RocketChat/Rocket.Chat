const twoFactorMethods = ['totp', 'email', 'password'] as const;

type TwoFactorMethod = (typeof twoFactorMethods)[number];

export const isTotpRequiredError = (error: unknown): error is { error: 'totp-required' } | { errorType: 'totp-required' } =>
	typeof error === 'object' &&
	((error as { error?: unknown } | undefined)?.error === 'totp-required' ||
		(error as { errorType?: unknown } | undefined)?.errorType === 'totp-required');

export const isTotpInvalidError = (error: unknown): error is { error: 'totp-invalid' } | { errorType: 'totp-invalid' } =>
	(error as { error?: unknown } | undefined)?.error === 'totp-invalid' ||
	(error as { errorType?: unknown } | undefined)?.errorType === 'totp-invalid';

export const isTwoFactorMethod = (method: string): method is TwoFactorMethod => twoFactorMethods.includes(method as TwoFactorMethod);

export const hasRequiredTwoFactorMethod = (error: unknown): error is { details: { method: TwoFactorMethod; emailOrUsername?: string } } => {
	const details = error && typeof error === 'object' && 'details' in error && (error.details as unknown);
	return (
		typeof details === 'object' &&
		details !== null &&
		typeof (details as { method: unknown }).method === 'string' &&
		isTwoFactorMethod((details as { method: string }).method)
	);
};
