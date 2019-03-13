import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { OAuthApps } from '/app/models';

Meteor.methods({
	deleteOAuthApp(applicationId) {
		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
		}
		const application = OAuthApps.findOne(applicationId);
		if (application == null) {
			throw new Meteor.Error('error-application-not-found', 'Application not found', { method: 'deleteOAuthApp' });
		}
		OAuthApps.remove({ _id: applicationId });
		return true;
	},
});
