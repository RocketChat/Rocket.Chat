import type { RocketchatI18nKeys } from '@rocket.chat/i18n';

/** Why a start from a conference link failed, for the two failures another try will not fix. */
const START_ERROR_REASONS = {
	'error-video-conf-links-not-supported': 'error-video-conf-links-not-supported',
	'error-invalid-conference-room': 'error-invalid-conference-room',
} as const satisfies Record<string, RocketchatI18nKeys>;

const isReasonCode = (code: unknown): code is keyof typeof START_ERROR_REASONS =>
	typeof code === 'string' && Object.hasOwn(START_ERROR_REASONS, code);

/** The translation key of a failed start's reason, or `undefined` when the failure is not one worth explaining. */
export const startErrorReason = (error: unknown): (typeof START_ERROR_REASONS)[keyof typeof START_ERROR_REASONS] | undefined => {
	if (typeof error !== 'object' || error === null || !('error' in error)) {
		return undefined;
	}

	return isReasonCode(error.error) ? START_ERROR_REASONS[error.error] : undefined;
};
