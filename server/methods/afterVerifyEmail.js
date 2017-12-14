import _ from 'underscore';

Meteor.methods({
	afterVerifyEmail() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		const verifiedEmail = _.find(user.emails, (email) => email.verified);

		if (verifiedEmail) {
			RocketChat.models.Roles.addUserRoles(user._id, 'user');
			RocketChat.models.Roles.removeUserRoles(user._id, 'anonymous');
		}
	}
});
