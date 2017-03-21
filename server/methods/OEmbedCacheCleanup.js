Meteor.methods({
	OEmbedCacheCleanup: function() {
		if (Meteor.userId() && !RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'OEmbedCacheCleanup'
			});
		}

		var date = new Date();
		var expirationDays = RocketChat.settings.get('API_EmbedCacheExpirationDays');
		date.setDate(date.getDate() - expirationDays);
		RocketChat.models.OEmbedCache.removeAfterDate(date);
		return {
			message: 'cache_cleared'
		};
	}
});
