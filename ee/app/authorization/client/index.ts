import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from '../lib/addRoleRestrictions';
import { AuthorizationUtils } from '../../../../app/authorization/client';

Meteor.startup(() => {
	Meteor.call('license:isEnterprise', (err: any, result: any) => {
		if (err) {
			throw err;
		}

		if (result) {
			addRoleRestrictions(AuthorizationUtils);
		}
	});
});
