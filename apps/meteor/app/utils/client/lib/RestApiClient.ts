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
 * A 401 means the request reached an authRequired route without a session the server recognizes.
 * That is only evidence of an expired session when the request was an action the user just took:
 * boot-time reads (OmnichannelProvider's livechat/config/routing, custom-sounds.list) fire before
 * the session is established and answer 401 with the same message, and clearing on those logs out
 * a session that is coming up. Restricting the wipe to mutations mirrors the DDP path this replaced
 * — ddpOverREST only clears credentials for method calls, never for background fetches — so a
 * session that dies while idle is noticed on the user's next write, exactly as before.
 */
const isMutation = (method: string): boolean => method === 'POST' || method === 'PUT' || method === 'DELETE';

APIClient.use(async (request, next) => {
	const [, method] = request;
	const tokenAtSend = getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			// Never 403 (authenticated but lacking permission) — that must not log the user out.
			// The token comparison keeps a request that was in flight across a re-login from
			// evicting the session it does not belong to.
			if (error.status === 401 && isMutation(method) && tokenAtSend && tokenAtSend === getStoredItem(STORAGE_KEYS.LOGIN_TOKEN)) {
				clearStoredCredentials();
			}
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
