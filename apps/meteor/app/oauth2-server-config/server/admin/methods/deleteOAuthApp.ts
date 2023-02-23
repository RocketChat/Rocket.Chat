import { Meteor } from 'meteor/meteor';
import { OAuthApps } from '@rocket.chat/models';
import type { IOAuthApps } from '@rocket.chat/core-typings';

import { hasPermission } from '../../../../authorization/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOAuthApp: (applicationId: IOAuthApps['_id']) => boolean;
	}
}

Meteor.methods({
	async deleteOAuthApp(applicationId) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteOAuthApp' });
		}

		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
		}

		const application = await OAuthApps.findOneById(applicationId);
		if (!application) {
			throw new Meteor.Error('error-application-not-found', 'Application not found', {
				method: 'deleteOAuthApp',
			});
		}

		await OAuthApps.deleteOne({ _id: applicationId });

		return true;
	},
});
