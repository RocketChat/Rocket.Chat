import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { handleIdentityToken } from '../lib/handleIdentityToken';

Accounts.registerLoginHandler('apple', async (loginRequest) => {
	if (!loginRequest.identityToken) {
		return;
	}

	if (!settings.get('Accounts_OAuth_Apple')) {
		return;
	}

	const { identityToken, fullName, email } = loginRequest;

	try {
		const serviceData = await handleIdentityToken(identityToken);

		if (!serviceData.email && email) {
			serviceData.email = email;
		}

		const profile: { name?: string } = {};

		const { givenName, familyName } = fullName;
		if (givenName && familyName) {
			profile.name = `${givenName} ${familyName}`;
		}

		const result = Accounts.updateOrCreateUserFromExternalService('apple', serviceData, { profile });

		// Ensure processing succeeded
		if (result === undefined || result.userId === undefined) {
			return {
				type: 'apple',
				error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'User creation failed from Apple response token'),
			};
		}

		return result;
	} catch (error: any) {
		return {
			type: 'apple',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, error.message),
		};
	}
});
