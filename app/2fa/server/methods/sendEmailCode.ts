import { Meteor } from 'meteor/meteor';

import { getUserForCheck, emailCheck } from '../code';
import { Users } from '../../../models/server';

Meteor.methods({
	sendEmailCode(emailOrUsername: string) {
		if (!emailOrUsername) {
			throw new Meteor.Error('error-parameter-required', 'emailOrUsername is required', { method: 'sendEmailCode' });
		}

		const method = emailOrUsername.includes('@') ? 'findOneByEmailAddress' : 'findOneByUsername';
		const userId: string = this.userId || Users[method](emailOrUsername, { fields: { _id: 1 } })?._id;

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendEmailCode' });
		}

		return emailCheck.sendEmailCode(getUserForCheck(userId));
	},
});
