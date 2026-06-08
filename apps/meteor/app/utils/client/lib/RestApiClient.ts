/* eslint-disable react-hooks/rules-of-hooks */
import { RestClient } from '@rocket.chat/api-client';
import { Meteor } from 'meteor/meteor';

import { invokeTwoFactorModal } from '../../../../client/lib/2fa/process2faReturn';
import { baseURI } from '../../../../client/lib/baseURI';
import { STORAGE_KEYS, getStoredItem, removeStoredItem } from '../../../../client/lib/sdk/storage';

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
 * This middleware will throw the error object instead, while preserving the HTTP status code.
 * */

APIClient.use(async (request, next) => {
	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			const e = await error.json();
			const errorObject = new Error(typeof e.message === 'string' ? e.message : 'API Error');
			Object.assign(errorObject, e, { status: error.status });
			throw errorObject;
		}

		throw error;
	}
});

/**
 * Auth error handling middleware: clears expired credentials on 401/403 errors.
 * This handles direct REST API calls that bypass ddpOverREST.
 */
APIClient.use(async (request, next) => {
	try {
		return await next(...request);
	} catch (error) {
		const e = error as { status?: number };

		const isAuthError = e.status === 401 || e.status === 403;

		if (isAuthError) {
			console.warn('[RestApiClient] Auth error detected, clearing credentials', { error });
			try {
				removeStoredItem(STORAGE_KEYS.USER_ID);
				removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
				removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN_EXPIRES);
				Meteor.connection.setUserId(null);
				console.log('[RestApiClient] Credentials cleared');
			} catch (cleanupError) {
				console.warn('[RestApiClient] Failed to clean up expired session', cleanupError);
			}
		}

		throw error;
	}
});
