import { addUserRoles, removeUserFromRoles } from '../../authorization';
import { Roles } from '../../models';


// Returns list of roles from SSO identity
export function mapRolesFromSSO(identity, roleClaimName) {
	let roles = [];

	if (identity && roleClaimName) {
		// Adding roles
		if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
			roles = identity[roleClaimName].filter((val) => val !== 'offline_access' && val !== 'uma_authorization' && Roles.findOneByIdOrName(val));
		}
	}

	return roles;
}

// Updates the user with roles from SSO identity
export function updateRolesFromSSO(user, identity, roleClaimName) {
	if (user && identity && roleClaimName) {
		const rolesFromSSO = mapRolesFromSSO(identity, roleClaimName);

		if (!Array.isArray(user.roles)) {
			user.roles = [];
		}

		const toRemove = user.roles.filter((val) => !rolesFromSSO.includes(val));

		// loop through roles that user has that sso doesnt have and remove
		toRemove.forEach(function(role) {
			removeUserFromRoles(user._id, role);
		});

		const toAdd = rolesFromSSO.filter((val) => !user.roles.includes(val));

		// loop through roles sso has that user doesnt and add
		toAdd.forEach(function(role) {
			addUserRoles(user._id, role);
		});
	}
}
