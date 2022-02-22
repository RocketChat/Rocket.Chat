import { LivechatRooms, LivechatVisitors } from '../../../../app/models/server';
import type { IRoom } from '../../../../definition/IRoom';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import type { AtLeast, ValueOf } from '../../../../definition/utils';
import { getLivechatRoomType } from '../../../../lib/rooms/roomTypes/livechat';
import { roomCoordinator } from '../roomCoordinator';

export const LivechatRoomType = getLivechatRoomType(roomCoordinator);

roomCoordinator.add(LivechatRoomType, {
	allowRoomSettingChange(_room, setting: ValueOf<typeof RoomSettingsEnum>): boolean {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	},

	allowMemberAction(_room, action: ValueOf<typeof RoomMemberActions>): boolean {
		return ([RoomMemberActions.INVITE, RoomMemberActions.JOIN] as Array<ValueOf<typeof RoomMemberActions>>).includes(action);
	},

	roomName(room: any, _userId?: string): string | undefined {
		return room.name || room.fname || room.label;
	},

	canAccessUploadedFile({ rc_token: token, rc_rid: rid }): boolean {
		return token && rid && LivechatRooms.findOneOpenByRoomIdAndVisitorToken(rid, token);
	},

	getNotificationDetails(room: IRoom, _sender, notificationMessage: string, userId) {
		const title = `[Omnichannel] ${this.roomName(room, userId)}`;
		const text = notificationMessage;

		return { title, text };
	},

	getMsgSender(senderId) {
		return LivechatVisitors.findOneById(senderId);
	},

	getReadReceiptsExtraData(message: any) {
		const { token } = message;
		return { token };
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
