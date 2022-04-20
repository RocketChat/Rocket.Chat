import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from '../lib/addRoleRestrictions';

Meteor.startup(() => {
	Meteor.call('license:isEnterprise', (err: any, result: any) => {
		if (err) {
			throw err;
		}

		if (result) {
			addRoleRestrictions();
		}
	});
});
