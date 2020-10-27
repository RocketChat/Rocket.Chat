import { addUserRoles, removeUserFromRoles } from '../../authorization';
import { Roles, Rooms } from '../../models';
import { addUserToRoom, createRoom } from '../../lib/server/functions';
import { Logger } from '../../logger';

export const logger = new Logger('OAuth', {});

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

export function mapSSOGroupsToChannels(user, identity, groupClaimName, channelsMap, channelsAdmin) {
	if (user && identity && groupClaimName) {
		const groupsFromSSO = identity[groupClaimName] || [];

		for (const ssoGroup in channelsMap) {
			if (typeof ssoGroup === 'string') {
				let channels = channelsMap[ssoGroup];
				if (!Array.isArray(channels)) {
					channels = [channels];
				}
				for (const channel of channels) {
					let room = Rooms.findOneByNonValidatedName(channel);
					if (!room) {
						room = createRoom('c', channel, channelsAdmin, [], false);
						if (!room || !room.rid) {
							logger.error(`could not create channel ${ channel }`);
							return;
						}
					}
					if (Array.isArray(groupsFromSSO) && groupsFromSSO.includes(ssoGroup)) {
						addUserToRoom(room._id, user);
					}
				}
			}
		}
	}
}
