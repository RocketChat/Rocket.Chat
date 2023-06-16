import type { AtLeast, ValueOf } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms } from '@rocket.chat/models';

import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getLivechatRoomType } from '../../../../lib/rooms/roomTypes/livechat';
import { roomCoordinator } from '../roomCoordinator';

const LivechatRoomType = getLivechatRoomType(roomCoordinator);

roomCoordinator.add(LivechatRoomType, {
	allowRoomSettingChange(_room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	},

	async allowMemberAction(_room, action) {
		return ([RoomMemberActions.INVITE, RoomMemberActions.JOIN] as Array<ValueOf<typeof RoomMemberActions>>).includes(action);
	},

	async roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	async canAccessUploadedFile({ rc_token: token, rc_rid: rid }) {
		return token && rid && !!(await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(rid, token));
	},

	async getNotificationDetails(room, _sender, notificationMessage, userId) {
		const roomName = await this.roomName(room, userId);
		const title = `[Omnichannel] ${roomName}`;
		const text = notificationMessage;

		return { title, text };
	},

	async getMsgSender(senderId) {
		return LivechatVisitors.findOneById(senderId);
	},

	getReadReceiptsExtraData(message) {
		const { token } = message as any;
		return { token };
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
