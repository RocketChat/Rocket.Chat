
import { Authorization } from '../../sdk';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomTokenpass } from './canAccessRoomTokenpass';
import { Subscriptions, Rooms, Settings, TeamMembers } from './service';

const roomAccessValidators: RoomAccessValidator[] = [
	async function(room, user): Promise<boolean> {
		if (!room?.teamId || !user?._id || !room?._id) {
			// if the room doesn't belongs to a team || no user is present || no room is present skip
			return false;
		}

		// to verify if a user can access a team's channel we should:
		// 1. Verify if the user is a team member
		const team = await TeamMembers.findOneByUserIdAndTeamId(user._id, room.teamId, { projection: { _id: 1 } });
		// 2. Verify if the user has an active subscription to channel (users can be on channels without being part of the team)
		const hasSubscription = await Subscriptions.countByRoomIdAndUserId(room._id, user._id);
		// 3. If it's a discussion, verify if the user can access the parent room
		if (!room?.prid) {
			if (room.t === 'p') {
				return !!hasSubscription;
			}
			return !!team || !!hasSubscription;
		}

		const parentRoom = await Rooms.findOne(room.prid);
		if (!parentRoom) {
			return false;
		}

		return Authorization.canAccessRoom(parentRoom, user);
	},

	async function(room, user): Promise<boolean> {
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

	async function(room, user): Promise<boolean> {
		if (!room?._id || !user?._id || room?.teamId) {
			return false;
		}
		if (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) {
			return true;
		}
		return false;
	},

	async function(room, user): Promise<boolean> {
		if (!room?.prid || room?.teamId) {
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
