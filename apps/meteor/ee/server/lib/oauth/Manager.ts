import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Roles, Rooms, Users } from '@rocket.chat/models';

import { addUserToRoom } from '../../../../app/lib/server/functions/addUserToRoom';
import { createRoom } from '../../../../app/lib/server/functions/createRoom';
import { getValidRoomName } from '../../../../app/utils/server/lib/getValidRoomName';
import { syncUserRoles } from '../syncUserRoles';

const logger = new Logger('OAuth');

export class OAuthEEManager {
	static async mapSSOGroupsToChannels(
		user: IUser,
		identity: Record<string, any>,
		groupClaimName: string,
		channelsMap: Record<string, any> | undefined,
		channelsAdmin: string,
	): Promise<void> {
		if (channelsMap && user && identity && groupClaimName) {
			const groupsFromSSO = identity[groupClaimName] || [];

			const userChannelAdmin = await Users.findOneByUsernameIgnoringCase(channelsAdmin);
			if (!userChannelAdmin) {
				logger.error(`could not create channel, user not found: ${channelsAdmin}`);
				return;
			}

			for await (const ssoGroup of Object.keys(channelsMap)) {
				if (typeof ssoGroup === 'string') {
					let channels = channelsMap[ssoGroup];
					if (!Array.isArray(channels)) {
						channels = [channels];
					}
					for await (const channel of channels) {
						const name = await getValidRoomName(channel.trim(), undefined, { allowDuplicates: true });
						let room = await Rooms.findOneByNonValidatedName(name);
						if (!room) {
							const createdRoom = await createRoom('c', channel, userChannelAdmin, [], false, false);
							if (!createdRoom?.rid) {
								logger.error(`could not create channel ${channel}`);
								return;
							}

							room = createdRoom;
						}

						if (room && Array.isArray(groupsFromSSO) && groupsFromSSO.includes(ssoGroup)) {
							await addUserToRoom(room._id, user);
						}
					}
				}
			}
		}
	}

	static async updateRolesFromSSO(
		user: Record<string, any>,
		identity: Record<string, any>,
		roleClaimName: string,
		rolesToSync: string[],
	): Promise<void> {
		if (user && identity && roleClaimName) {
			const rolesFromSSO = await this.mapRolesFromSSO(identity, roleClaimName);

			if (!Array.isArray(user.roles)) {
				user.roles = [];
			}

			const rolesIdsFromSSO = (await Roles.findInIdsOrNames(rolesFromSSO).toArray()).map((role) => role._id);
			const allowedRoles = (await Roles.findInIdsOrNames(rolesToSync).toArray()).map((role) => role._id);

			await syncUserRoles(user._id, rolesIdsFromSSO, {
				allowedRoles,
			});
		}
	}

	// Returns list of roles from SSO identity
	static async mapRolesFromSSO(identity: Record<string, any>, roleClaimName: string): Promise<string[]> {
		if (!identity || !roleClaimName || !identity[roleClaimName] || !Array.isArray(identity[roleClaimName])) {
			return [];
		}

		const baseRoles = identity[roleClaimName] as string[];

		const filteredRoles = baseRoles.filter((val) => val !== 'offline_access' && val !== 'uma_authorization');
		const validRoleList = [];
		for await (const role of filteredRoles) {
			if (await Roles.findOneByIdOrName(role)) {
				validRoleList.push(role);
			}
		}

		return validRoleList;
	}
}
