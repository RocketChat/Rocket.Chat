import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { handleIdentityToken } from './tokenHandler';
import { settings } from '../../settings';

Accounts.registerLoginHandler('apple', (loginRequest) => {
	if (!loginRequest.identityToken) {
		return;
	}

	if (!settings.get('Accounts_OAuth_Apple')) {
		return;
	}

	const identityResult = handleIdentityToken(loginRequest);

	if (!identityResult.error) {
		const result = Accounts.updateOrCreateUserFromExternalService('apple', identityResult.serviceData, identityResult.options);

		// Ensure processing succeeded
		if (result === undefined || result.userId === undefined) {
			return {
				type: 'apple',
				error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'User creation failed from Apple response token'),
			};
		}

		return result;
	}

	return identityResult;
});
