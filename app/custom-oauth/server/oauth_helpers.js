import { addUserRoles, removeUserFromRoles } from '../../authorization';
import { Roles } from '../../models';


/**
*/
export function mapRolesFromSSO(user, identity, roleClaimName) {
	if (user && identity && roleClaimName) {
		// Adding roles
		if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
			user.roles = identity[roleClaimName].filter((val) => val !== 'offline_access' && val !== 'uma_authorization');
		}
	}
	return user;
}

/**
*/
export function updateRolesFromSSO(user, identity, roleClaimName) {
	if (user && identity && roleClaimName) {
		// loop through all assigned roles and drop if not assigned anymore
		user.roles.forEach(function(role) {
			if (Roles.findOneByIdOrName(role)) {
				removeUserFromRoles(user._id, role);
			}
		});
		user = mapRolesFromSSO(user, identity, roleClaimName);
		// loop through all roles from SSO Provider and add them if needed
		user.roles.forEach(function(role) {
			addUserRoles(user._id, role);
		});
	}
}
