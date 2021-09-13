import { addUserRoles, removeUserFromRoles } from '../../../app/authorization/server';
import { Roles, Rooms } from '../../../app/models/server';
import { addUserToRoom, createRoom } from '../../../app/lib/server/functions';
import { Logger } from '../../../app/logger/server';
import { onLicense } from '../../app/license/server';

export const logger = new Logger('OAuth');

// TODO ---> add types to all static methods
export class EnterpriseOAuthHelpers {
	static mapSSOGroupsToChannels(user: any, identity: any, groupClaimName: any, channelsMap: any, channelsAdmin: any): any {
		onLicense('oAuth-enterprise', () => {
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
		});
	}

	static updateRolesFromSSO(user: any, identity: any, roleClaimName: any): any {
		onLicense('oAuth-enterprise', () => {
			if (user && identity && roleClaimName) {
				const rolesFromSSO = this.mapRolesFromSSO(identity, roleClaimName);

				if (!Array.isArray(user.roles)) {
					user.roles = [];
				}

				const toRemove = user.roles.filter((val: any) => !rolesFromSSO.includes(val));

				// loop through roles that user has that sso doesnt have and remove
				toRemove.forEach(function(role: any) {
					removeUserFromRoles(user._id, role);
				});

				const toAdd = rolesFromSSO.filter((val: any) => !user.roles.includes(val));

				// loop through roles sso has that user doesnt and add
				toAdd.forEach(function(role: any) {
					addUserRoles(user._id, role);
				});
			}
		});
	}

	// Returns list of roles from SSO identity
	static mapRolesFromSSO(identity: any, roleClaimName: any): any {
		onLicense('oAuth-enterprise', () => {
			let roles = [];

			if (identity && roleClaimName) {
				// Adding roles
				if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
					// TODO: add types
					roles = identity[roleClaimName].filter((val: any) => val !== 'offline_access' && val !== 'uma_authorization' && Roles.findOneByIdOrName(val));
				}
			}

			return roles;
		});
	}
}
