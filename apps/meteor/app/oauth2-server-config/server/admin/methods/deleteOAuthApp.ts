import { Meteor } from 'meteor/meteor';
import { OAuthApps } from '@rocket.chat/models';

import { hasPermission } from '../../../../authorization/server';
import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async deleteOAuthApp(applicationId) {
		methodDeprecationLogger.warn('deleteOAuthApp will be deprecated in future versions of Rocket.Chat');

		if (!this.userId || !hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
		}
		const application = await OAuthApps.findOneById(applicationId);
		if (application == null) {
			throw new Meteor.Error('error-application-not-found', 'Application not found', {
				method: 'deleteOAuthApp',
			});
		}
		await OAuthApps.deleteOne({ _id: applicationId });
		return true;
	},
});
