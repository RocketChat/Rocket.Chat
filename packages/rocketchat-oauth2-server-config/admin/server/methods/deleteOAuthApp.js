Meteor.methods({
	deleteOAuthApp(applicationId) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });
		}
		const application = RocketChat.models.OAuthApps.findOne(applicationId);
		if (application == null) {
			throw new Meteor.Error('error-application-not-found', 'Application not found', { method: 'deleteOAuthApp' });
		}
		RocketChat.models.OAuthApps.remove({ _id: applicationId });
		return true;
	}
});
