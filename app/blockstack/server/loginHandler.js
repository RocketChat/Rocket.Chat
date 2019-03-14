import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { settings } from '/app/settings';
import { Users } from '/app/models';
import { setUserAvatar } from '/app/lib';
import { updateOrCreateUser } from './userHandler';
import { handleAccessToken } from './tokenHandler';
import { logger } from './logger';

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
			const user = Users.findOneById(result.userId, { fields: { 'services.blockstack.image': 1, username: 1 } });
			if (user && user.services && user.services.blockstack && user.services.blockstack.image) {
				Meteor.runAsUser(user._id, () => {
					setUserAvatar(user, user.services.blockstack.image, undefined, 'url');
				});
			}
		} catch (e) {
			console.error(e);
		}
	}

	delete result.isNew;

	return result;
});
