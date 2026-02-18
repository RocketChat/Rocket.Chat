import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';

Meteor.methods({
	async '2fa:checkCodesRemaining'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		return (Authorization as any).check2FARemainingCodes(userId);
	},
});