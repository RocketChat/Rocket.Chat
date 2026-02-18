import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';

Meteor.methods({
	async '2fa:disable'(code: string) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		if (!code) {
			throw new Meteor.Error('error-invalid-code');
		}

		return (Authorization as any).disable2FA(userId, code);
	}
});
