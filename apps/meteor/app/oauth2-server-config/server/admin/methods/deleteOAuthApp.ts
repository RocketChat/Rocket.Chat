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

Meteor.methods<ServerMethods>({
	async deleteOAuthApp(applicationId) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteOAuthApp' });
		}

		if (!(await hasPermissionAsync(this.userId, 'manage-oauth-apps'))) {
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
	},
});
