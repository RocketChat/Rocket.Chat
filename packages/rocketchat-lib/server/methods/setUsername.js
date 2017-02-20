Meteor.methods({
	setUsername(username, param = {}) {
		const { joinDefaultChannelsSilenced } = param;
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		const user = Meteor.user();

		if (user.username && !RocketChat.settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user.username === username) {
			return username;
		}

		let nameValidation;
		try {
			nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}

		if (!nameValidation.test(username)) {
			throw new Meteor.Error('username-invalid', `${_.escape(username)} is not a valid username, use only letters, numbers, dots, hyphens and underscores`);
		}

		if (user.username !== undefined) {
			if (!username.toLowerCase() === user.username.toLowerCase()) {
				if (!RocketChat.checkUsernameAvailability(username)) {
					throw new Meteor.Error('error-field-unavailable', `<strong>${_.escape(username)}</strong> is already in use :(`, { method: 'setUsername', field: username });
				}
			}
		} else if (!RocketChat.checkUsernameAvailability(username)) {
			throw new Meteor.Error('error-field-unavailable', `<strong>${_.escape(username)}</strong> is already in use :(`, { method: 'setUsername', field: username });
		}

		if (!RocketChat.setUsername(user._id, username)) {
			throw new Meteor.Error('error-could-not-change-username', 'Could not change username', { method: 'setUsername' });
		}

		if (!user.username) {
			Meteor.runAsUser(user._id, () => Meteor.call('joinDefaultChannels', joinDefaultChannelsSilenced));
			Meteor.defer(function() {
				return RocketChat.callbacks.run('afterCreateUser', RocketChat.models.Users.findOneById(user._id));
			});
		}

		return username;
	}
});

RocketChat.RateLimiter.limitMethod('setUsername', 1, 1000, {
	userId() { return true; }
});
