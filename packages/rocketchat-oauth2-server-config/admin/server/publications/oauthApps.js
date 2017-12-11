Meteor.publish('oauthApps', function() {
	if (!this.userId) {
		return this.ready();
	}
	if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
		this.error(Meteor.Error('error-not-allowed', 'Not allowed', { publish: 'oauthApps' }));
	}
	return RocketChat.models.OAuthApps.find();
});
