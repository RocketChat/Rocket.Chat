import { Meteor } from 'meteor/meteor';

import { passwordPolicy } from '../../app/lib';

Meteor.methods({
	checkUserPassword(password) {
		return passwordPolicy.validate(password);
	},
});
