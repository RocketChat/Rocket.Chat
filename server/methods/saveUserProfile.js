Meteor.methods({
	saveUserProfile(settings, customFields) {
		check(settings, Object);

		if (!RocketChat.settings.get('Accounts_AllowUserProfileChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'saveUserProfile'
			});
		}

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveUserProfile'
			});
		}

		const user = RocketChat.models.Users.findOneById(Meteor.userId());

		function checkPassword(user = {}, typedPassword) {
			if (!(user.services && user.services.password && user.services.password.bcrypt && user.services.password.bcrypt.trim())) {
				return true;
			}

			const passCheck = Accounts._checkPassword(user, {
				digest: typedPassword,
				algorithm: 'sha-256'
			});

			if (passCheck.error) {
				return false;
			}
			return true;
		}

		if (settings.realname) {
			RocketChat.setRealName(Meteor.userId(), settings.realname);
		}

		if (settings.username) {
			Meteor.call('setUsername', settings.username);
		}

		if (settings.email) {
			if (!checkPassword(user, settings.typedPassword)) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile'
				});
			}

			Meteor.call('setEmail', settings.email);
		}

		// Should be the last check to prevent error when trying to check password for users without password
		if ((settings.newPassword) && RocketChat.settings.get('Accounts_AllowPasswordChange') === true) {
			if (!checkPassword(user, settings.typedPassword)) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile'
				});
			}

			Accounts.setPassword(Meteor.userId(), settings.newPassword, {
				logout: false
			});
		}

		RocketChat.models.Users.setProfile(Meteor.userId(), {});

		RocketChat.saveCustomFields(Meteor.userId(), customFields);

		return true;
	}
});
