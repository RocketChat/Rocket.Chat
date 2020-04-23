import { AuthorizationUtils } from '../../../../app/authorization/lib/AuthorizationUtils';
import { Permissions } from '../../../../app/models/server';
import { guestPermissions } from '../lib/guestPermissions';

export const addRoleRestrictions = function() {
	// Add everything except the guestPermissions to the restricted list of the guest role
	const permissions = Permissions.find({}, { fields: { _id: true } });
	permissions.forEach(({ _id }) => {
		if (guestPermissions.includes(_id)) {
			return true;
		}

		AuthorizationUtils.addRestrictedRolePermission('guest', _id);
	});
};
