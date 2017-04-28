Meteor.methods({
	setAvatarFromService(dataURI, contentType, service) {
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setAvatarFromService'
			});
		}

		if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setAvatarFromService'
			});
		}

		const user = Meteor.user();

		return RocketChat.setUserAvatar(user, dataURI, contentType, service);
	},

	saveAvatarFile(file) {
		check(file, Match.ObjectIncluding({
			_id: String
		}));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setAvatarFromService'
			});
		}

		if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setAvatarFromService'
			});
		}

		const user = RocketChat.models.Users.findOneById(Meteor.userId());
		const fileSaved = RocketChat.models.Avatars.findOneById(file._id);

		if (!fileSaved) {
			return;
		}

		if (fileSaved.userId !== user._id) {
			// this file is not user's avatar
			throw new Meteor.Error('invalid-avatar');
		}

		// just returns if file already complete (case for GridFS)
		if (fileSaved.complete) {
			return true;
		}

		RocketChat.models.Avatars.updateFileCompleteByNameAndUserId(user.username, user._id, file.url);

		return true;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setAvatarFromService',
	userId() {
		return true;
	}
}, 1, 5000);
