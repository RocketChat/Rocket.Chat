import type { IOAuthApps } from '@rocket.chat/core-typings';
import { OAuthAccessTokens, OAuthApps, OAuthAuthCodes } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';

export const deleteOAuthApp = async (userId: string, applicationId: IOAuthApps['_id']): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'manage-oauth-apps'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
	}

	const application = await OAuthApps.findOneAndDeleteById(applicationId, { projection: { clientId: 1 } });
	if (!application) {
		throw new Meteor.Error('error-application-not-found', 'Application not found', {
			method: 'deleteOAuthApp',
		});
	}

	await OAuthAccessTokens.deleteMany({ clientId: application.clientId });
	await OAuthAuthCodes.deleteMany({ clientId: application.clientId });

	return true;
};
