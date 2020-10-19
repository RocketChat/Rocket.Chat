import { addUserRoles, removeUserFromRoles } from '../../authorization';
import { Roles } from '../../models';
import { Logger } from '../../logger';

const logger = new Logger('CustomOAuth');

// Returns list of roles from SSO identity
export function mapRolesFromSSO(identity, roleClaimName, useMap, map) {
	let roles = [];

	if (identity && roleClaimName) {
		// Adding roles
		if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
			let roleMap;
			if (useMap) {
				// use the specified map to map roles from the identity to RocketChat roles
				try {
					roleMap = JSON.parse(map);
				} catch (err) {
					logger.error(`Unexpected error while parsing role map: ${ err.message }`);
					return [];
				}
				roles = identity[roleClaimName].filter((val) => val in roleMap && Roles.findOneByIdOrName(roleMap[val])).map((val) => roleMap[val]);
			} else {
				// Map the roles from the identity directly to RocketChat Roles
				roles = identity[roleClaimName].filter((val) => val !== 'offline_access' && val !== 'uma_authorization' && Roles.findOneByIdOrName(val));
			}
		}
	}

	return roles;
}

// Updates the user with roles from SSO identity
export function updateRolesFromSSO(user, identity, roleClaimName, useMap, map) {
	if (user && identity && roleClaimName) {
		const rolesFromSSO = mapRolesFromSSO(identity, roleClaimName, useMap, map);

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
