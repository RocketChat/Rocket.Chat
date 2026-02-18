import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';

Meteor.methods({
	async '2fa:validateTempToken'(token: string) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		if (!token) {
			throw new Meteor.Error('error-invalid-token');
		}

		return (Authorization as any).validateTempToken(userId, token);
	},
});