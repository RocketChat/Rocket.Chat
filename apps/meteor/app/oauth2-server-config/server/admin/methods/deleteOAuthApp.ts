import type { IOAuthApps } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { OAuthAccessTokens, OAuthApps, OAuthAuthCodes } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOAuthApp(applicationId: IOAuthApps['_id']): boolean;
	}
}

export const deleteOAuthApp = async (userId: string, applicationId: IOAuthApps['_id']): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'manage-oauth-apps'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
	}

	const application = await OAuthApps.findOneById(applicationId);
	if (!application) {
		throw new Meteor.Error('error-application-not-found', 'Application not found', {
			method: 'deleteOAuthApp',
		});
	}

	await OAuthApps.deleteOne({ _id: applicationId });

	await OAuthAccessTokens.deleteMany({ clientId: application.clientId });
	await OAuthAuthCodes.deleteMany({ clientId: application.clientId });

	return true;
};

Meteor.methods<ServerMethods>({
	async deleteOAuthApp(applicationId) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteOAuthApp' });
		}

		return deleteOAuthApp(this.userId, applicationId);
	},
});
