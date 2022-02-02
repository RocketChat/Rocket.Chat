import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom } from '../../models/client/models/ChatRoom';
import { settings } from '../../settings/server/index';
import { hasPermission } from '../../authorization/client/index';
import { openRoom } from '../../ui-utils/client/index';
import { getAvatarURL } from '../../utils/lib/getAvatarURL';
import { RoomMemberActions, RoomSettingsEnum, UiTextContext, RoomTypeRouteConfig, RoomTypeConfig } from '../../utils/server';

let LivechatInquiry: any;
if (Meteor.isClient) {
	({ LivechatInquiry } = require('../client/collections/LivechatInquiry'));
}

class LivechatRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'live',
			path: '/live/:id/:tab?/:context?',
		});
	}

	action(params: { id: any }) {
		openRoom('l', params.id);
	}

	link(sub: { rid: any }) {
		return {
			id: sub.rid,
		};
	}
}

export default class LivechatRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'l',
			order: 5,
			icon: 'omnichannel',
			label: 'Omnichannel',
			route: new LivechatRoomRoute(),
		});

		this.notSubscribedTpl = 'livechatNotSubscribed';
		this.readOnlyTpl = 'livechatReadOnly';
	}

	enableMembersListProfile() {
		return true;
	}

	findRoom(identifier) {
		return ChatRoom.findOne({ _id: identifier });
	}

	roomName(roomData: IRoom): string {
		return roomData.name || roomData.fname || roomData.label;
	}

	condition(): ISetting {
		return settings.get('Livechat_enabled') && hasPermission('view-l-room');
	}

	canSendMessage(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1 } });
		return room && room.open === true;
	}

	getUserStatus(rid: string): any {
		const room = Session.get(`roomData${rid}`);
		if (room) {
			return room.v && room.v.status;
		}
		const inquiry = LivechatInquiry.findOne({ rid });
		return inquiry?.v?.status;
	}

	allowRoomSettingChange(_room: any, setting: number | string): boolean {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	}

	allowMemberAction(_room: any, action: any): any {
		return [RoomMemberActions.INVITE, RoomMemberActions.JOIN].includes(action);
	}

	getUiText(context: any): string {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Livechat_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Livechat_Warning';
			default:
				return '';
		}
	}

	readOnly(rid: string): boolean {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1, servedBy: 1 } });
		if (!room || !room.open) {
			return true;
		}

		const inquiry = LivechatInquiry.findOne({ rid }, { fields: { status: 1 } });
		if (inquiry && inquiry.status === 'queued') {
			return true;
		}

		return !room.servedBy;
	}

	getAvatarPath(roomData: string): string {
		return getAvatarURL({ username: `@${this.roomName(roomData)}` });
	}

	openCustomProfileTab(instance: any, room: any, username: string): boolean {
		if (!room || !room.v || room.v.username !== username) {
			return false;
		}

		instance.tabBar.openUserInfo();
		return true;
	}

	showQuickActionButtons(): boolean {
		return true;
	}

	isLivechatRoom(): boolean {
		return true;
	}
}
