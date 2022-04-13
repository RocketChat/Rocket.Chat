import type { AtLeast, ValueOf } from '@rocket.chat/core-typings';

import { LivechatRooms, LivechatVisitors } from '../../../../app/models/server';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getLivechatRoomType } from '../../../../lib/rooms/roomTypes/livechat';
import { roomCoordinator } from '../roomCoordinator';

export const LivechatRoomType = getLivechatRoomType(roomCoordinator);

roomCoordinator.add(LivechatRoomType, {
	allowRoomSettingChange(_room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	},

	allowMemberAction(_room, action) {
		return ([RoomMemberActions.INVITE, RoomMemberActions.JOIN] as Array<ValueOf<typeof RoomMemberActions>>).includes(action);
	},

	roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	canAccessUploadedFile({ rc_token: token, rc_rid: rid }) {
		return token && rid && LivechatRooms.findOneOpenByRoomIdAndVisitorToken(rid, token);
	},

	getNotificationDetails(room, _sender, notificationMessage, userId) {
		const title = `[Omnichannel] ${this.roomName(room, userId)}`;
		const text = notificationMessage;

		return { title, text };
	},

	getMsgSender(senderId) {
		return LivechatVisitors.findOneById(senderId);
	},

	getReadReceiptsExtraData(message) {
		const { token } = message as any;
		return { token };
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
