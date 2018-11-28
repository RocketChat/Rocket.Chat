import { Meteor } from 'meteor/meteor';

export default {
	async checkUsernameAvailability(ctx) {
		const { username, uid } = ctx.params;

		if (uid) {
			const user = RocketChat.models.Users.findOneById(uid);

			if (user.username && !RocketChat.settings.get('Accounts_AllowUsernameChange')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
			}

			if (user.username === username) {
				return true;
			}

		}
		return RocketChat.checkUsernameAvailability(username);
	},
};
