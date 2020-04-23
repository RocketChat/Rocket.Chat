import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from './addRoleRestrictions';

Meteor.startup(() => {
	Meteor.call('license:isEnterprise', (err, result) => {
		if (err) {
			throw err;
		}

		if (result) {
			addRoleRestrictions();
		}
	});
});
