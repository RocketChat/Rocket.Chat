import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { passwordPolicy } from '../../app/lib';

Meteor.methods({
	checkUserPassword(password) {
		return passwordPolicy.validate(password);
	},
});
