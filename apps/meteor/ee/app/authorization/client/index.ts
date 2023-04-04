import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from '../lib/addRoleRestrictions';

Meteor.startup(async () => {
	const result = await Meteor.callAsync('license:isEnterprise');
	if (result) {
		addRoleRestrictions();
	}
});
