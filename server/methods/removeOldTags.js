import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../app/models';

Meteor.methods({
	removeOldTags(tags) {
		check(tags, Array);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeTags',
			});
		}

		const result = Rooms.unsetTagsByName(tags);

		return result;
	},
});
