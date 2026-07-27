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
	const tokenAtSend = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			// A 401 on a request that carried the *current* token means that token is no longer
			// valid (expired or revoked server-side). DDP-routed calls cleared credentials via
			// ddpOverREST; direct REST calls must do the same so the router falls through to the
			// login page instead of leaving the user wedged. Only 401 (unauthenticated) — never
			// 403 (authenticated but lacking permission), which must not log the user out.
			//
			// The token comparison is what keeps this from logging out a healthy session: an
			// authRequired call fired before login completes (OmnichannelProvider's
			// livechat/config/routing, custom-sounds.list) 401s with no token at send time, and a
			// request still in flight across a re-login 401s carrying the previous session's token.
			// Neither says anything about the credentials currently stored.
			if (error.status === 401 && tokenAtSend && tokenAtSend === getStoredItem(STORAGE_KEYS.LOGIN_TOKEN)) {
				clearStoredCredentials();
			}
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
