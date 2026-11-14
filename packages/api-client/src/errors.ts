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
	const details = error && typeof error === 'object' && 'details' in error && error.details;
	return (
		typeof details === 'object' &&
		details !== null &&
		typeof (details as { method: unknown }).method === 'string' &&
		isTwoFactorMethod((details as { method: string }).method)
	);
};

export class InvalidResponseError extends Error {
	/**
	 * The response that failed validation. Its body has already been consumed,
	 * so use it for `status`, `headers` and `url` only.
	 */
	readonly response: Response;

	constructor(message: string, response: Response, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'InvalidResponseError';
		this.response = response;
	}
}
