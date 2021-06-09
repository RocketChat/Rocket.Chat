import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models';

Meteor.methods({
	'banner/dismiss'({ id }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'banner/dismiss' });
		}

		Users.setBannerReadById(this.userId, id);
	},
});
