import { Users } from '../../../../app/models/server';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import type { IUser } from '../../../../definition/IUser';
import type { AtLeast } from '../../../../definition/utils';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

export const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	roomName(room: any): string | undefined {
		return room.name || room.fname || room.label;
	},

	getNotificationDetails(room, _user, notificationMessage: string) {
		const title = `[Omnichannel] ${this.roomName(room)}`;
		const text = notificationMessage;

		return { title, text };
	},

	getMsgSender(senderId: string): IUser {
		return Users.findOneById(senderId);
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
