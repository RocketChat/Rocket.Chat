import { settings } from '../../settings/client';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

Meteor.startup(() => {
	const trustRoles = settings.get('Trust_Roles');
	if (trustRoles) {
		addRoleEditRestriction();
	}
});
