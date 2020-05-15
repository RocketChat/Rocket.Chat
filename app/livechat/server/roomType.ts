import { LivechatRooms, LivechatVisitors } from '../../models';
import { roomTypes } from '../../utils';
import LivechatRoomType from '../lib/LivechatRoomType';
import { ISettingsBase } from '../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../models/lib';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { IUser } from '../../../definition/IUser';
import { settings } from '../../settings/server';
import { Rooms, Users } from '../../models/server';
import { AuthorizationUtils } from '../../authorization/server';


class LivechatRoomTypeServer extends LivechatRoomType {

	constructor(settings: ISettingsBase,
				Users: IUsersRepository,
				Rooms: IRoomsRepository,
				AuthorizationUtils: IAuthorization){
		super(settings, Users, Rooms, AuthorizationUtils);
	}

	getMsgSender(senderId: string): string {
		return LivechatVisitors.findOneById(senderId);
	}

	/**
	 * Returns details to use on notifications
	 *
	 * @param {object} room
	 * @param {object} user
	 * @param {string} notificationMessage
	 * @return {object} Notification details
	 */
	getNotificationDetails(room: any, user: IUser, notificationMessage: string): any {
		const title = `[Omnichannel] ${ this.roomName(room) }`;
		const text = notificationMessage;

		return { title, text };
	}

	canAccessUploadedFile({ rc_token, rc_rid }: any = {}): boolean {
		return rc_token && rc_rid && Boolean(LivechatRooms.findOneOpenByRoomIdAndVisitorToken(rc_rid, rc_token));
	}

	getReadReceiptsExtraData(message: any): any {
		const { token } = message;
		return { token };
	}

	isEmitAllowed(): boolean {
		return true;
	}
}

roomTypes.add(new LivechatRoomTypeServer(settings, Users, Rooms, AuthorizationUtils));
