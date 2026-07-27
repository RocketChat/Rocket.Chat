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

/**
 * Wiping the stored credentials is irreversible — the login token only lives in localStorage, so
 * once it is gone there is nothing left to resume the session with, and the user is logged out for
 * real. A 401 from an arbitrary endpoint is not enough evidence to spend that: an auth check can be
 * throttled by the per-route rate limiter and answer 401 while the token is perfectly valid (see
 * the note in client/startup/startup.ts), and boot-time calls such as OmnichannelProvider's
 * livechat/config/routing fire before the session is established.
 *
 * `/v1/me` is the authority on whether the session is still alive. Re-check it once per burst; if it
 * also 401s, this same middleware clears the credentials on that response — that is the only place
 * the wipe happens.
 */
let sessionRecheck: Promise<unknown> | undefined;

const recheckSession = (): Promise<unknown> => {
	sessionRecheck ??= APIClient.get('/v1/me')
		.catch(() => undefined)
		.finally(() => {
			sessionRecheck = undefined;
		});

	return sessionRecheck;
};

APIClient.use(async (request, next) => {
	const [endpoint] = request;
	const tokenAtSend = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			// Only 401 (unauthenticated) — never 403 (authenticated but lacking permission), which
			// must not log the user out. The token comparison keeps a request that was in flight
			// across a re-login from evicting the session it does not belong to.
			if (error.status === 401 && tokenAtSend && tokenAtSend === getStoredItem(STORAGE_KEYS.LOGIN_TOKEN)) {
				if (endpoint === '/v1/me') {
					clearStoredCredentials();
				} else {
					void recheckSession();
				}
			}
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
