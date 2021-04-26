import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';

Meteor.methods({
	checkExistingPassword() {
		const userId = Meteor.userId();
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'checkExistingPassword' });
		}
		const user = Users.findOneById(userId);

		return Boolean(user?.services?.password?.bcrypt?.trim());
	},
});
