import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization';
import { OAuthApps } from '../../../../models/server/raw';

Meteor.methods({
	async deleteOAuthApp(applicationId) {
		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
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
