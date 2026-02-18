import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';

Meteor.methods({
	async '2fa:enable'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		await (Authorization as any).enable2FA(userId);
	},
});