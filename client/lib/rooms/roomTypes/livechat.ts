import { Session } from 'meteor/session';

import { hasPermission } from '../../../../app/authorization/client';
import { LivechatInquiry } from '../../../../app/livechat/client/collections/LivechatInquiry';
import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getAvatarURL } from '../../../../app/utils/lib/getAvatarURL';
import type { IRoom, IOmnichannelRoom } from '../../../../definition/IRoom';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import type { AtLeast, ValueOf } from '../../../../definition/utils';
import { getLivechatRoomType } from '../../../../lib/rooms/roomTypes/livechat';
import { roomCoordinator } from '../roomCoordinator';

export const LivechatRoomType = getLivechatRoomType(roomCoordinator);

roomCoordinator.add(LivechatRoomType, {
	allowRoomSettingChange(_room: Partial<IRoom>, setting: ValueOf<typeof RoomSettingsEnum>): boolean {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	},

	allowMemberAction(_room: Partial<IRoom>, action: ValueOf<typeof RoomMemberActions>): boolean {
		return ([RoomMemberActions.INVITE, RoomMemberActions.JOIN] as Array<ValueOf<typeof RoomMemberActions>>).includes(action);
	},

	roomName(room: any): string | undefined {
		return room.name || room.fname || room.label;
	},

	openCustomProfileTab(instance: any, room: IOmnichannelRoom, username: string): boolean {
		if (!room?.v || (room.v as any).username !== username) {
			return false;
		}

		instance.tabBar.openUserInfo();
		return true;
	},

	getUiText(context: ValueOf<typeof UiTextContext>): string {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Livechat_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Livechat_Warning';
			default:
				return '';
		}
	},

	condition(): boolean {
		return settings.get('Livechat_enabled') && hasPermission('view-l-room');
	},

	getAvatarPath(room): string {
		return getAvatarURL({ username: `@${this.roomName(room)}` }) || '';
	},

	getUserStatus(rid: string): string | undefined {
		const room = Session.get(`roomData${rid}`);
		if (room) {
			return room.v && room.v.status;
		}
		const inquiry = LivechatInquiry.findOne({ rid });
		return inquiry?.v?.status;
	},

	findRoom(identifier: string): IRoom | undefined {
		return ChatRoom.findOne({ _id: identifier });
	},

	isLivechatRoom(): boolean {
		return true;
	},

	canSendMessage(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1 } });
		return Boolean(room?.open);
	},

	readOnly(rid: string, _user): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1, servedBy: 1 } });
		if (!room || !room.open) {
			return true;
		}

		const subscription = ChatSubscription.findOne({ rid });
		return !subscription;
	},
} as AtLeast<IRoomTypeClientDirectives, 'roomName'>);
