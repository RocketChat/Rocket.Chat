import VoipRoomType from '../lib/VoipRoomType';
import { Users } from '../../models/server';
import { IUser } from '../../../definition/IUser';
import { IRoom } from '../../../definition/IRoom';
import { roomTypes } from '../../utils/server';

class VoipRoomTypeServer extends VoipRoomType {
	getMsgSender(senderId: string): IUser {
		return Users.findOneById(senderId);
	}

	getNotificationDetails(room: IRoom & { label: string }, _user: IUser, notificationMessage: string): { title: string; text: string } {
		const title = `[VoIP] ${this.roomName(room)}`;
		const text = notificationMessage;

		return { title, text };
	}
}

// @ts-expect-error - Here, for some reason VoipRoomType is not inherit-ing some props from VoipRoomType
// Or from RoomTypeConfig, and it's throwing an error. The actual values are there, but TS error is something to look into
roomTypes.add(new VoipRoomTypeServer());
