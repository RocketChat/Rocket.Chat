import { Meteor } from 'meteor/meteor';

import { addRoleRestrictions } from '../lib/addRoleRestrictions';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';

Meteor.startup(async () => {
	const result = await sdk.call('license:isEnterprise');
	if (result) {
		addRoleRestrictions();
	}
});
