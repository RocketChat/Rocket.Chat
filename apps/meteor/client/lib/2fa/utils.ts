import type { MeteorErrorLike } from './types';

export { isTotpInvalidError, isTotpRequiredError } from '@rocket.chat/api-client';

export const isTotpMaxAttemptsError = (
	error: unknown,
): error is MeteorErrorLike & ({ error: 'totp-max-attempts' } | { errorType: 'totp-max-attempts' }) =>
	(error as { error?: unknown } | undefined)?.error === 'totp-max-attempts' ||
	(error as { errorType?: unknown } | undefined)?.errorType === 'totp-max-attempts';
