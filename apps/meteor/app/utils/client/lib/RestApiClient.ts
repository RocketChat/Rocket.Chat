/* eslint-disable react-hooks/rules-of-hooks */
import { RestClient } from '@rocket.chat/api-client';
import { Accounts } from 'meteor/accounts-base';

import { invokeTwoFactorModal } from '../../../../client/lib/2fa/process2faReturn';
import { baseURI } from '../../../../client/lib/baseURI';

class RestApiClient extends RestClient {
	getCredentials():
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined {
		const [uid, token] = [
			Accounts.storageLocation.getItem(Accounts.USER_ID_KEY),
			Accounts.storageLocation.getItem(Accounts.LOGIN_TOKEN_KEY),
		];

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
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
