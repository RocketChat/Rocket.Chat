import type { TFunction } from 'i18next';

import { getAddPasskeyErrorMessage } from './getAddPasskeyErrorMessage';

const t = ((key: string) => key) as unknown as TFunction;

describe('getAddPasskeyErrorMessage', () => {
	it('tells the user the passkey is already added, whether the browser or the server noticed', () => {
		expect(
			getAddPasskeyErrorMessage(t, Object.assign(new Error('The authenticator was previously registered'), { name: 'InvalidStateError' })),
		).toBe('Passkey_already_added');
		expect(getAddPasskeyErrorMessage(t, { errorType: 'error-passkey-already-registered', error: 'already registered' })).toBe(
			'Passkey_already_added',
		);
	});

	it('explains the passkey limit and verification failures', () => {
		expect(getAddPasskeyErrorMessage(t, { errorType: 'error-passkey-limit-reached' })).toBe('Passkey_limit_reached');
		expect(getAddPasskeyErrorMessage(t, { errorType: 'error-passkey-invalid' })).toBe('Passkey_could_not_be_verified');
	});

	it('passes any other error on for the toast to describe', () => {
		const restError = { errorType: 'error-forbidden', error: 'Passkeys are disabled' };
		const networkError = new TypeError('Failed to fetch');

		expect(getAddPasskeyErrorMessage(t, restError)).toBe(restError);
		expect(getAddPasskeyErrorMessage(t, networkError)).toBe(networkError);
	});
});
