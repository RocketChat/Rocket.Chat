import { addUserRoles, removeUserFromRoles } from '../../../app/authorization/server';
import { Roles, Rooms } from '../../../app/models/server';
import { addUserToRoom, createRoom } from '../../../app/lib/server/functions';
import { Logger } from '../../../app/logger/server';

export const logger = new Logger('OAuth');

export class EnterpriseOAuthHelpers {
	static mapSSOGroupsToChannels(user: Record<string, any>, identity: Record<string, any>, groupClaimName: string, channelsMap: Record<string, any> | undefined, channelsAdmin: string): void {
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

	static updateRolesFromSSO(user: Record<string, any>, identity: Record<string, any>, roleClaimName: string): void {
		if (user && identity && roleClaimName) {
			const rolesFromSSO = this.mapRolesFromSSO(identity, roleClaimName);

			if (!Array.isArray(user.roles)) {
				user.roles = [];
			}

			const toRemove = user.roles.filter((val: any) => !rolesFromSSO.includes(val));

			// loop through roles that user has that sso doesnt have and remove each one
			toRemove.forEach(function(role: any) {
				removeUserFromRoles(user._id, role);
			});

			const toAdd = rolesFromSSO.filter((val: any) => !user.roles.includes(val));

			// loop through sso roles and add the new ones
			toAdd.forEach(function(role: any) {
				addUserRoles(user._id, role);
			});
		}
	}

	// Returns list of roles from SSO identity
	static mapRolesFromSSO(identity: Record<string, any>, roleClaimName: string): string[] {
		let roles: string[] = [];
		if (identity && roleClaimName) {
			// Adding roles
			if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
				roles = identity[roleClaimName].filter((val: string) => val !== 'offline_access' && val !== 'uma_authorization' && Roles.findOneByIdOrName(val));
			}
		}

		return roles;
	}
}
