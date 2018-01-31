Meteor.methods({
	OEmbedCacheCleanup() {
		if (Meteor.userId() && !RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'OEmbedCacheCleanup'
			});
		}

		const date = new Date();
		const expirationDays = RocketChat.settings.get('API_EmbedCacheExpirationDays');
		date.setDate(date.getDate() - expirationDays);
		RocketChat.models.OEmbedCache.removeAfterDate(date);
		return {
			message: 'Done'
		};
	}
});
