/* eslint-disable  @typescript-eslint/camelcase */
import { LivechatInquiry, LivechatRooms, LivechatVisitors, Subscriptions, Users } from '../../models/server';
import { roomTypes, roomCommonUtils } from '../../utils/server';
import LivechatRoomType from '../lib/LivechatRoomType';
import { ISettingsBase } from '../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../models/lib';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { IUser } from '../../../definition/IUser';
import { settings } from '../../settings/server';
import { AuthorizationUtils } from '../../authorization/server';
import { IRoomCommonUtils } from '../../utils/lib/IRoomCommonUtils';
import { ISubscriptionRepository } from '../../models/lib/ISubscriptionRepository';
import { ILivechatInquiryRepository } from '../../models/lib/ILivechatInquiryRepository';
import { ICommonUtils } from '../../utils/lib/ICommonUtils';
import { commonUtils } from '../../utils/server/factory';
import { IRoomTypesCommon } from '../../utils/lib/RoomTypesCommon';

class LivechatRoomTypeServer extends LivechatRoomType {
	public constructor(settings: ISettingsBase,
		Users: IUsersRepository,
		Rooms: IRoomsRepository,
		Subscriptions: ISubscriptionRepository,
		LivechatInquiry: ILivechatInquiryRepository,
		AuthorizationUtils: IAuthorization,
		RoomCommonUtils: IRoomCommonUtils,
		CommonUtils: ICommonUtils,
		RoomTypesCommon: IRoomTypesCommon,
	) {
		super({
			settings,
			Users,
			Rooms,
			Subscriptions,
			AuthorizationUtils,
			RoomCommonUtils,
			CommonUtils,
			RoomTypesCommon,
		},
		LivechatInquiry);
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

roomTypes.add(new LivechatRoomTypeServer(settings, Users, LivechatRooms, Subscriptions, LivechatInquiry, AuthorizationUtils, roomCommonUtils, commonUtils, roomTypes));
