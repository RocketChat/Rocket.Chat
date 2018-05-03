Meteor.methods({
	resetAvatar() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetAvatar'
			});
		}

		if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetAvatar'
			});
		}

		const user = Meteor.user();
		FileUpload.getStore('Avatars').deleteByName(user.username);
		RocketChat.models.Users.unsetAvatarOrigin(user._id);
		RocketChat.Notifications.notifyLogged('updateAvatar', {
			username: user.username
		});
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetAvatar',
	userId() {
		return true;
	}
}, 1, 60000);
