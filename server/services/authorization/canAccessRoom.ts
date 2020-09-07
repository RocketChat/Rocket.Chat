
import { Authorization } from '../../sdk';
// TODO: change to MS instance
import { getValue } from '../../../app/settings/server/raw';
import { Subscriptions, Rooms } from '../../../app/models/server/raw';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomTokenpass } from './canAccessRoomTokenpass';

export const roomAccessValidators: RoomAccessValidator[] = [
	async function(room, user): Promise<boolean> {
		if (room.t === 'c') {
			const anonymous = await getValue('Accounts_AllowAnonymousRead');
			if (!user._id && anonymous === true) {
				return true;
			}

			return Authorization.hasPermission(user._id, 'view-c-room');
		}

		return false;
	},

	async function(room, user): Promise<boolean> {
		if (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) {
			return true;
		}
		return false;
	},

	async function(room, user): Promise<boolean> {
		if (!room.prid) {
			return false;
		}
		return Authorization.canAccessRoom(Rooms.findOne(room.prid), user);
	},
	canAccessRoomLivechat,
	canAccessRoomTokenpass,
];

export const canAccessRoom: RoomAccessValidator = async (room, user, extraData) => {
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
