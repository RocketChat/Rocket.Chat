import { Meteor } from 'meteor/meteor';
import { OAuthApps } from '@rocket.chat/models';

import { hasPermission } from '../../../../authorization/server';
import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async deleteOAuthApp(applicationId) {
		methodDeprecationLogger.warn(
			'deleteOAuthApp is deprecated and will be in future versions of Rocket.Chat. Use the REST endpoint /v1/oauth-apps.delete instead.',
		);

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
