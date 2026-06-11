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

	const { identityToken, fullName } = loginRequest;

	try {
		const clientId = settings.get<string>('Accounts_OAuth_Apple_id') || '';

		const serviceData = await handleIdentityToken(identityToken, clientId);

		const profile: { name?: string } = {};

		const { givenName, familyName } = fullName || {};
		if (givenName && familyName) {
			profile.name = `${givenName} ${familyName}`;
		}

		const result = await Accounts.updateOrCreateUserFromExternalService('apple', serviceData, { profile });

		if (result?.userId === undefined) {
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
