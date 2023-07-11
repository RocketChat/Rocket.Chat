import { Meteor } from 'meteor/meteor';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { addRoleRestrictions } from '../../app/authorization/lib/addRoleRestrictions';

Meteor.startup(async () => {
	const result = await sdk.call('license:isEnterprise');

	if (result) {
		addRoleRestrictions();
	}
});
