import { settings } from '../../settings/client';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

Meteor.startup(() => {
	settings.onload('Trust_Roles', (_key, value) => {
		if (value) {
			addRoleEditRestriction();
		}
	});
});
