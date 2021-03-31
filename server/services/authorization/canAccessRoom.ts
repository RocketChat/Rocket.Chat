
import { Authorization } from '../../sdk';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomTokenpass } from './canAccessRoomTokenpass';
import { Subscriptions, Rooms, Settings, TeamMembers } from './service';

const roomAccessValidators: RoomAccessValidator[] = [
	async function _validateAccessToPublicRoomsInTeams(room, user): Promise<boolean> {
		if (!room) {
			return false;
		}
		if (!room._id || !room.teamId || room.t !== 'c' || !user?._id) {
			// if the room doesn't belongs to a team || no user is present || no room is present skip
			return false;
		}

		const team = await TeamMembers.findOneByUserIdAndTeamId(user._id, room.teamId, { projection: { _id: 1 } });
		return !!team;
	},

	async function _validateAccessToPublicRooms(room, user): Promise<boolean> {
		if (!room?._id || room.t !== 'c' || room?.teamId) {
			return false;
		}

		if (!user?._id) {
			// TODO: it was using cached version from /app/settings/server/raw.js
			const anon = await Settings.getValueById('Accounts_AllowAnonymousRead');
			return !!anon;
		}

		return Authorization.hasPermission(user._id, 'view-c-room');
	},

	async function _validateIfAlreadyJoined(room, user): Promise<boolean> {
		if (!room?._id || !user?._id) {
			return false;
		}
		if (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) {
			return true;
		}
		return false;
	},

	async function _validateAccessToDiscussionsParentRoom(room, user): Promise<boolean> {
		if (!room?.prid) {
			return false;
		}

		const parentRoom = await Rooms.findOne(room.prid);
		if (!parentRoom) {
			return false;
		}

		return Authorization.canAccessRoom(parentRoom, user);
	},

	canAccessRoomLivechat,
	canAccessRoomTokenpass,
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
