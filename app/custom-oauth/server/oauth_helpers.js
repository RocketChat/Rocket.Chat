
import { Roles } from '../../models';

/**
*/
export function mapRolesFromSSO(user, identity) {
	// Adding roles
	if (user && identity.roles) {
		// loop through all assigned roles and drop if not assigned anymore
		user.roles.forEach(function(roleFromOAuthProvider) {
			if (identity.roles.length === 0) {
				Roles.removeUserFromRoles(user._id, roleFromOAuthProvider);
			}
			if (identity.roles.indexOf(roleFromOAuthProvider) === -1) {
				Roles.removeUserFromRoles(user._id, roleFromOAuthProvider);
			}
		});
		// loop through all roles from SSO Provider and add them if needed
		identity.roles.forEach(function(roleFromOAuthProvider) {
			if (user.roles.indexOf(roleFromOAuthProvider) === -1
				/* filter OpenID pseudo roles */
				&& roleFromOAuthProvider !== 'offline_access' && roleFromOAuthProvider !== 'uma_authorization') {
				Roles.addUserRoles(user._id, roleFromOAuthProvider);
			}
		});
	} else {
		// else drop all roles
		user.roles.forEach(function(roleFromOAuthProvider) {
			Roles.removeUserFromRoles(user._id, roleFromOAuthProvider);
		});
	}
	return true;
}
