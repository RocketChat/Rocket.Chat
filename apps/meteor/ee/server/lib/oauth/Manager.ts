import { Roles } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { Rooms } from '../../../../app/models/server';
import { addUserToRoom, createRoom } from '../../../../app/lib/server/functions';
import { Logger } from '../../../../app/logger/server';
import { syncUserRoles } from '../syncUserRoles';

export const logger = new Logger('OAuth');

export class OAuthEEManager {
	static mapSSOGroupsToChannels(
		user: IUser,
		identity: Record<string, any>,
		groupClaimName: string,
		channelsMap: Record<string, any> | undefined,
		channelsAdmin: string,
	): void {
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
								logger.error(`could not create channel ${channel}`);
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

	static updateRolesFromSSO(user: Record<string, any>, identity: Record<string, any>, roleClaimName: string, rolesToSync: string[]): void {
		if (user && identity && roleClaimName) {
			const rolesFromSSO = this.mapRolesFromSSO(identity, roleClaimName);

			if (!Array.isArray(user.roles)) {
				user.roles = [];
			}

			const rolesIdsFromSSO = Promise.await(Roles.findInIdsOrNames(rolesFromSSO).toArray()).map((role) => role._id);
			const allowedRoles = Promise.await(Roles.findInIdsOrNames(rolesToSync).toArray()).map((role) => role._id);

			Promise.await(
				syncUserRoles(user._id, rolesIdsFromSSO, {
					allowedRoles,
				}),
			);
		}
	}

	// Returns list of roles from SSO identity
	static mapRolesFromSSO(identity: Record<string, any>, roleClaimName: string): string[] {
		let roles: string[] = [];
		if (identity && roleClaimName) {
			// Adding roles
			if (identity[roleClaimName] && Array.isArray(identity[roleClaimName])) {
				roles = identity[roleClaimName].filter(
					(val: string) => val !== 'offline_access' && val !== 'uma_authorization' && Promise.await(Roles.findOneByIdOrName(val)),
				);
			}
		}

		return roles;
	}
}
