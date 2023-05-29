import { settings } from '../../settings/client';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

Meteor.startup(async () => {
	const trustRoles = settings.get('Trust_Roles');
	if (trustRoles) {
		await addRoleEditRestriction();
	}
});
