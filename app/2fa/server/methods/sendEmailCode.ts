import { Meteor } from 'meteor/meteor';

import { getUserForCheck, emailCheck } from '../code';

Meteor.methods({
	sendEmailCode() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendEmailCode' });
		}

		emailCheck.sendEmailCode(getUserForCheck(this.userId));
	},
});
