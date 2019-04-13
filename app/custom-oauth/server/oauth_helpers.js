import { addUserRoles, removeUserFromRoles } from '../../authorization';

/**
*/
export function mapRolesFromSSO(user, identity, roleClaimName) {
	if (user && identity && roleClaimName) {
		// Adding roles
		if (identity[roleClaimName]) {
			if (Array.isArray(identity[roleClaimName])) {
				// loop through all assigned roles and drop if not assigned anymore
				user[roleClaimName].forEach(function(roleFromOAuthProvider) {
					if (identity[roleClaimName].length === 0) {
						removeUserFromRoles(user._id, roleFromOAuthProvider);
					}
					if (identity[roleClaimName].indexOf(roleFromOAuthProvider) === -1) {
						removeUserFromRoles(user._id, roleFromOAuthProvider);
					}
				});
				// loop through all roles from SSO Provider and add them if needed
				identity[roleClaimName].forEach(function(roleFromOAuthProvider) {
					if (user[roleClaimName].indexOf(roleFromOAuthProvider) === -1
						/* filter OpenID pseudo roles */
						&& roleFromOAuthProvider !== 'offline_access' && roleFromOAuthProvider !== 'uma_authorization') {
						addUserRoles(user._id, roleFromOAuthProvider);
					}
				});
			}
		} else {
			// else drop all roles
			user[roleClaimName].forEach(function(roleFromOAuthProvider) {
				removeUserFromRoles(user._id, roleFromOAuthProvider);
			});
		}
	}
}
