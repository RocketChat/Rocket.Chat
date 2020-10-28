
import { Authorization } from '../../sdk';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomTokenpass } from './canAccessRoomTokenpass';
import { Subscriptions, Rooms, Settings } from './service';

const roomAccessValidators: RoomAccessValidator[] = [
	async function(room, user): Promise<boolean> {
		if (room.t === 'c') {
			// TODO: it was using cached version from /app/settings/server/raw.js
			const anonymous = await Settings.getValueById('Accounts_AllowAnonymousRead');
			if (!user._id && anonymous === true) {
				return true;
			}

			return Authorization.hasPermission(user._id, 'view-c-room');
		}

		return false;
	},

	async function(room, user): Promise<boolean> {
		if (!room._id) {
			return false;
		}
		if (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) {
			return true;
		}
		return false;
	},

	async function(room, user): Promise<boolean> {
		if (!room.prid) {
			return false;
		}
		room = await Rooms.findOne(room.prid);
		if (!room) {
			return false;
		}
		return Authorization.canAccessRoom(room, user);
	},
	canAccessRoomLivechat,
	canAccessRoomTokenpass,
];

export const canAccessRoom: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	if (!room || !user) {
		return false;
	}

	for await (const roomAccessValidator of roomAccessValidators) {
		if (await roomAccessValidator(room, user, extraData)) {
			return true;
		}
	}

	return false;
};
