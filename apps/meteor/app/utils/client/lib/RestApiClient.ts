/* eslint-disable react-hooks/rules-of-hooks */
import { RestClient } from '@rocket.chat/api-client';

import { invokeTwoFactorModal } from '../../../../client/lib/2fa/process2faReturn';
import { baseURI } from '../../../../client/lib/baseURI';
import { clearStoredCredentials } from '../../../../client/lib/sdk/ddpSdk';
import { STORAGE_KEYS, getStoredItem } from '../../../../client/lib/sdk/storage';

class RestApiClient extends RestClient {
	override getCredentials():
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined {
		const [uid, token] = [getStoredItem(STORAGE_KEYS.USER_ID), getStoredItem(STORAGE_KEYS.LOGIN_TOKEN)];

		if (!uid || !token) {
			return;
		}
		return {
			'X-User-Id': uid,
			'X-Auth-Token': token,
		};
	}
}

export const APIClient = new RestApiClient({
	baseUrl: baseURI.replace(/\/$/, ''),
});

APIClient.handleTwoFactorChallenge(invokeTwoFactorModal);

/**
 * The original rest api code throws the Response object, which is very useful
 * for the client sometimes, if the developer wants to access more information about the error
 * unfortunately/fortunately Rocket.Chat expects an error object (from Response.json()
 * This middleware will throw the error object instead.
 * */

APIClient.use(async (request, next) => {
	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			// A 401 means the stored session token is no longer valid (expired or revoked
			// server-side). DDP-routed calls cleared credentials via ddpOverREST; direct REST
			// calls must do the same so the router falls through to the login page instead of
			// leaving the user wedged. Only 401 (unauthenticated) — never 403 (authenticated but
			// lacking permission), which must not log the user out.
			if (error.status === 401) {
				clearStoredCredentials();
			}
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
