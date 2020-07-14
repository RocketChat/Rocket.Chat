import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { handleAccessToken } from './tokenHandler';
import { settings } from '../../settings';

Accounts.registerLoginHandler('apple', (loginRequest) => {
	if (!loginRequest.identityToken) {
		return;
	}

	if (!settings.get('Accounts_OAuth_Apple')) {
		return;
	}

	const auth = handleAccessToken(loginRequest);

	if (!auth.error) {
		const result = Accounts.updateOrCreateUserFromExternalService('apple', auth.serviceData, auth.options);

		// Ensure processing succeeded
		if (result === undefined || result.userId === undefined) {
			return {
				type: 'apple',
				error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'User creation failed from Apple response token'),
			};
		}

		return result;
	}

	return auth;
});
