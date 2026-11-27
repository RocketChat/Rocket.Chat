import type { RocketchatI18nKeys } from '@rocket.chat/i18n';

const CONFERENCE_LINK_ERRORS = {
	'error-invalid-title': 'error-invalid-title',
	'error-invalid-conference-room': 'error-invalid-conference-room',
	'error-video-conf-links-not-supported': 'error-video-conf-links-not-supported',
	'error-not-allowed': 'error-not-allowed',
} as const satisfies Record<string, RocketchatI18nKeys>;

const isConferenceLinkErrorCode = (code: unknown): code is keyof typeof CONFERENCE_LINK_ERRORS =>
	typeof code === 'string' && Object.hasOwn(CONFERENCE_LINK_ERRORS, code);

/** The translation key of why a request on a conference link failed. */
export const conferenceLinkErrorKey = (
	error: unknown,
): (typeof CONFERENCE_LINK_ERRORS)[keyof typeof CONFERENCE_LINK_ERRORS] | 'error-videoconf-unexpected' => {
	if (typeof error !== 'object' || error === null || !('error' in error)) {
		return 'error-videoconf-unexpected';
	}

	return isConferenceLinkErrorCode(error.error) ? CONFERENCE_LINK_ERRORS[error.error] : 'error-videoconf-unexpected';
};
