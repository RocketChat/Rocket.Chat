import { TEAM_TYPE, ITeam } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Settings, TeamMember, Team } from '@rocket.chat/models';

import { Authorization } from '../../sdk';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomVoip } from './canAccessRoomVoip';

async function canAccessPublicRoom(user?: Partial<IUser>): Promise<boolean> {
	if (!user?._id) {
		// TODO: it was using cached version from /app/settings/server/raw.js
		const anon = await Settings.getValueById('Accounts_AllowAnonymousRead');
		return !!anon;
	}

	return Authorization.hasPermission(user._id, 'view-c-room');
}

const roomAccessValidators: RoomAccessValidator[] = [
	async function _validateAccessToPublicRoomsInTeams(room, user): Promise<boolean> {
		if (!room) {
			return false;
		}
		if (!room._id || !room.teamId || room.t !== 'c') {
			// if the room doesn't belongs to a team || is not a public channel - skip
			return false;
		}

		// if team is public, access is allowed if the user can access public rooms
		const team = await Team.findOneById<Pick<ITeam, 'type'>>(room.teamId, {
			projection: { type: 1 },
		});
		if (team?.type === TEAM_TYPE.PUBLIC) {
			return canAccessPublicRoom(user);
		}

		// otherwise access is allowed only to members of the team
		const membership =
			user?._id &&
			(await TeamMember.findOneByUserIdAndTeamId(user._id, room.teamId, {
				projection: { _id: 1 },
			}));
		return !!membership;
	},

	async function _validateAccessToPublicRooms(room, user): Promise<boolean> {
		if (!room?._id || room.t !== 'c' || room?.teamId) {
			return false;
		}

		return canAccessPublicRoom(user);
	},

	async function _validateIfAlreadyJoined(room, user): Promise<boolean> {
		if (!room?._id || !user?._id) {
			return false;
		}

		if (!(await Subscriptions.countByRoomIdAndUserId(room._id, user._id))) {
			return false;
		}

		if (await Authorization.hasPermission(user._id, 'view-joined-room')) {
			return true;
		}

		return Authorization.hasPermission(user._id, `view-${room.t}-room`);
	},

	async function _validateAccessToDiscussionsParentRoom(room, user): Promise<boolean> {
		if (!room?.prid) {
			return false;
		}

		const parentRoom = await Rooms.findOneById(room.prid);
		if (!parentRoom) {
			return false;
		}

		return Authorization.canAccessRoom(parentRoom, user);
	},

	canAccessRoomLivechat,
	canAccessRoomVoip,
];

export const canAccessRoom: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// TODO livechat can send both as null, so they we need to validate nevertheless
	// if (!room || !user) {
	// 	return false;
	// }

	for await (const roomAccessValidator of roomAccessValidators) {
		if (await roomAccessValidator(room, user, extraData)) {
			return true;
		}
	}

	return false;
};
