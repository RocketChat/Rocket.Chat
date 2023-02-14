import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../../models/server';
import { API } from '../api';

API.helperMethods.set('getLoggedInUser', function _getLoggedInUser(this: any) {
	if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
		return Users.findOne({
			'_id': this.request.headers['x-user-id'],
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token']),
		});
	}
});
