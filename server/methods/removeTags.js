import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../app/models';

Meteor.methods({
	removeTags() {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeTags',
			});
		}

		const result = Rooms.unsetAllTags();

		return result;
	},
});
