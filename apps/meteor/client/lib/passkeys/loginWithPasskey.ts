import { startAuthentication } from '@simplewebauthn/browser';

import { loginWithToken } from '../../meteor/accounts';
import { sdk } from '../SDKClient';
import { isPasskeyCeremonyCancelled, isRestError } from './errors';

/** Carries a failed sign-in the way login methods report one: `error` is the code and `reason` the message. */
class PasskeyLoginError extends Error {
	constructor(
		readonly error: string,
		readonly reason?: string,
	) {
		super(reason ?? error);
	}
}

/** Asks the browser for one of the user's passkeys and signs in with it; throws `passkey-canceled` when the user backs out. */
export const loginWithPasskey = async (): Promise<void> => {
	try {
		const { options } = await sdk.rest.post('/v1/passkeys.generateAuthenticationOptions');
		const credential = await startAuthentication({ optionsJSON: options });
		const { authToken } = await sdk.rest.post('/v1/passkeys.login', { credential });
		await loginWithToken(authToken);
	} catch (error) {
		if (isPasskeyCeremonyCancelled(error)) {
			throw new PasskeyLoginError('passkey-canceled');
		}

		if (isRestError(error)) {
			throw new PasskeyLoginError(error.errorType, error.error);
		}

		throw error;
	}
};
