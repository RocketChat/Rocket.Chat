import { addUserRoles, removeUserFromRoles } from '../../../../app/authorization/server';
import { findRoomByNonValidatedName } from '../../../../server/lib/findRoomByNonValidatedName';
import { addUserToRoom, createRoom } from '../../../../app/lib/server/functions';
import { Logger } from '../../../../app/logger/server';
import { Roles } from '../../../../app/models/server/raw';
import type { IRoom, ICreatedRoom } from '../../../../definition/IRoom';

export const logger = new Logger('OAuth');

export class OAuthEEManager {
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
						const room = findRoomByNonValidatedName(channel);
						let rid: IRoom['_id'] | undefined = room?._id;

						if (!rid) {
							// #ToDo: Remove the typecast once createRoom is properly typed
							const newRoom = createRoom('c', channel, channelsAdmin, [], false) as unknown as ICreatedRoom | undefined;
							if (!newRoom?.rid) {
								logger.error(`could not create channel ${ channel }`);
								return;
							}

							rid = newRoom.rid;
						}

						if (Array.isArray(groupsFromSSO) && groupsFromSSO.includes(ssoGroup)) {
							addUserToRoom(rid, user);
						}
					}
				}
			}
		}
	}

	static updateRolesFromSSO(user: Record<string, any>, identity: Record<string, any>, roleClaimName: string, rolesToSync: string[]): void {
		if (user && identity && roleClaimName) {
			const rolesFromSSO = this.mapRolesFromSSO(identity, roleClaimName);

			if (!Array.isArray(user.roles)) {
				user.roles = [];
			}

			const toRemove = user.roles.filter((val: any) => !rolesFromSSO.includes(val) && rolesToSync.includes(val));

			// remove all roles that the user has, but sso doesnt
			removeUserFromRoles(user._id, toRemove);

			const toAdd = rolesFromSSO.filter((val: any) => !user.roles.includes(val) && (!rolesToSync.length || rolesToSync.includes(val)));

			// add all roles that sso has, but the user doesnt
			addUserRoles(user._id, toAdd);
		}
	}

	// Returns list of roles from SSO identity
	static mapRolesFromSSO(identity: Record<string, any>, roleClaimName: string): string[] {
		let roles: string[] = [];
		if (identity && roleClaimName) {
			// Adding roles
			if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
				roles = identity[roleClaimName].filter((val: string) => val !== 'offline_access' && val !== 'uma_authorization' && Promise.await(Roles.findOneByIdOrName(val)));
			}
		}

		return roles;
	}
}
