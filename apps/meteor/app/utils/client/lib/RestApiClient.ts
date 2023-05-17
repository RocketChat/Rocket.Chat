import { RestClient } from '@rocket.chat/api-client';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { baseURI } from '../../../../client/lib/baseURI';
import { invokeTwoFactorModal } from '../../../../client/lib/2fa/process2faReturn';

class RestApiClient extends RestClient {
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

APIClient.handleTwoFactorChallenge(invokeTwoFactorModal);
