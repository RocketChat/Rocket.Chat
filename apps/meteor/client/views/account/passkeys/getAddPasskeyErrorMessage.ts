import type { TFunction } from 'i18next';

import { isRestError } from '../../../lib/passkeys/errors';

/** What to tell a user whose passkey could not be added; other errors are passed on for the toast to describe. */
export const getAddPasskeyErrorMessage = (t: TFunction, error: unknown): unknown => {
	if (error instanceof Error && error.name === 'InvalidStateError') {
		return t('Passkey_already_added');
	}

	if (!isRestError(error)) {
		return error;
	}

	switch (error.errorType) {
		case 'error-passkey-already-registered':
			return t('Passkey_already_added');
		case 'error-passkey-limit-reached':
			return t('Passkey_limit_reached');
		case 'error-passkey-invalid':
			return t('Passkey_could_not_be_verified');
		default:
			return error;
	}
};
