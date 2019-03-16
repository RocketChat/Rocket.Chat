import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';

Meteor.methods({
	'e2e.updateSavedKeyUser'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.updateSavedKeyUser' });
		}
		return Users.updateSavedKeyUserState(userId);
	},
});
