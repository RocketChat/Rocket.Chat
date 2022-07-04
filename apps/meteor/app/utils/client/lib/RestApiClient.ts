import { RestClient } from '@rocket.chat/api-client';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { baseURI } from '../../../../client/lib/baseURI';
import { process2faReturn } from '../../../../client/lib/2fa/process2faReturn';

export class RestApiClient extends RestClient {
	getCredentials():
		| {
				'X-User-Id': string;
				'X-Auth-Token': string;
		  }
		| undefined {
		const [uid, token] = [Meteor._localStorage.getItem(Accounts.USER_ID_KEY), Meteor._localStorage.getItem(Accounts.LOGIN_TOKEN_KEY)];

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

APIClient.use(async function (request, next) {
	try {
		return await next(...request);
	} catch (error) {
		if (!(error instanceof Response) || error.status !== 400) {
			throw error;
		}

		const e = await error.json();

		return new Promise(async (resolve, reject) => {
			process2faReturn({
				error: e,
				result: null,
				emailOrUsername: undefined,
				originalCallback: () => reject(e),
				onCode(code, method) {
					return resolve(
						next(request[0], request[1], {
							...request[2],
							headers: { ...request[2]?.headers, 'x-2fa-code': code, 'x-2fa-method': method },
						}),
					);
				},
			});
		});
	}
});
