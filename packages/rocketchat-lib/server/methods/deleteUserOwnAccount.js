import s from 'underscore.string';

Meteor.methods({
	deleteUserOwnAccount(password) {

		check(password, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (!RocketChat.settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteUserOwnAccount' });
		}

		const userId = Meteor.userId();
		const user = RocketChat.models.Users.findOneById(userId);

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteUserOwnAccount' });
		}

		if (user.services && user.services.password && s.trim(user.services.password.bcrypt)) {
			const result = Accounts._checkPassword(user, { digest: password, algorithm: 'sha-256' });
			if (result.error) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', { method: 'deleteUserOwnAccount' });
			}
		} else if (user.username !== s.trim(password)) {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'deleteUserOwnAccount' });
		}

		Meteor.defer(function() {
			RocketChat.deleteUser(userId);
		});

		return true;
	}
});
