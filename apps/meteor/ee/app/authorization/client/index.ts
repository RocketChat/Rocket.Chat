import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from '../lib/addRoleRestrictions';

Meteor.startup(async () => {
	await Meteor.callAsync('license:isEnterprise', (err: any, result: any) => {
		if (err) {
			throw err;
		}

		if (result) {
			addRoleRestrictions();
		}
	});
});
