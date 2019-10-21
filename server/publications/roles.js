import { Meteor } from 'meteor/meteor';

import { Roles } from '../../app/models';

Meteor.methods({
	'roles/get'() {
		if (!Meteor.userId()) {
			return [];
		}

		const records = Roles.find().fetch();

		return records;
	},
});
