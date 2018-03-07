Meteor.methods({
	'banner/dismiss'({ id }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'banner/dismiss' });
		}

		RocketChat.models.Users.removeBannerById(this.userId, {
			id
		});
	}
});
