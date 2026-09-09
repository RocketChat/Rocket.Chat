import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { addOAuthService } from '../../lib/oauth/addOAuthService';

export const addOAuthServiceMethod = async (userId: string, name: string): Promise<void> => {
	if ((await hasPermissionAsync(userId, 'add-oauth-service')) !== true) {
		throw new Meteor.Error('error-action-not-allowed', 'Adding OAuth Services is not allowed', {
			method: 'addOAuthService',
			action: 'Adding_OAuth_Services',
		});
	}

	await addOAuthService(name);
};
