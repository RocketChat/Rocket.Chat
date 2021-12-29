import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { updateOrCreateUser } from './userHandler';
import { handleAccessToken } from './tokenHandler';
import { logger } from './logger';
import { settings } from '../../settings/server';
import { Users } from '../../models';
import { setUserAvatar } from '../../lib';

// Blockstack login handler, triggered by a blockstack authResponse in route
Accounts.registerLoginHandler('blockstack', (loginRequest) => {
	if (!loginRequest.blockstack || !loginRequest.authResponse) {
		return;
	}

	if (!settings.get('Blockstack_Enable')) {
		return;
	}

	logger.debug('Processing login request', loginRequest);

	const auth = handleAccessToken(loginRequest);

	// TODO: Fix #9484 and re-instate usage of accounts helper
	// const result = Accounts.updateOrCreateUserFromExternalService('blockstack', auth.serviceData, auth.options)
	const result = updateOrCreateUser(auth.serviceData, auth.options);
	logger.debug('User create/update result', result);

	// Ensure processing succeeded
	if (result === undefined || result.userId === undefined) {
		return {
			type: 'blockstack',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'User creation failed from Blockstack response token'),
		};
	}

	if (result.isNew) {
		try {
			const user = Users.findOneById(result.userId, {
				fields: { 'services.blockstack.image': 1, 'username': 1 },
			});
			if (user && user.services && user.services.blockstack && user.services.blockstack.image) {
				Meteor.runAsUser(user._id, () => {
					setUserAvatar(user, user.services.blockstack.image, undefined, 'url');
				});
			}
		} catch (e) {
			logger.error(e);
		}
	}

	delete result.isNew;

	return result;
});
