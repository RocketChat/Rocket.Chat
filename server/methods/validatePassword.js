import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { passwordPolicy } from '../../app/lib';

Meteor.methods({
	validatePassword(password) {
		check(password, String);

		return passwordPolicy.validate(password);
	},
});
