import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom } from '../../models';
import { settings } from '../../settings';
import { hasPermission } from '../../authorization';
import { openRoom } from '../../ui-utils';
import { RoomMemberActions, RoomSettingsEnum, UiTextContext, RoomTypeRouteConfig, RoomTypeConfig } from '../../utils';
import { getAvatarURL } from '../../utils/lib/getAvatarURL';

let LivechatInquiry;
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

	action(params) {
		openRoom('l', params.id);
	}

	link(sub) {
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

	roomName(roomData) {
		return roomData.name || roomData.fname || roomData.label;
	}

	condition() {
		return settings.get('Livechat_enabled') && hasPermission('view-l-room');
	}

	canSendMessage(rid) {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1 } });
		return room && room.open === true;
	}

	getUserStatus(rid) {
		const room = Session.get(`roomData${ rid }`);
		if (room) {
			return room.v && room.v.status;
		}
		const inquiry = LivechatInquiry.findOne({ rid });
		return inquiry && inquiry.v && inquiry.v.status;
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	}

	allowMemberAction(room, action) {
		return [RoomMemberActions.INVITE, RoomMemberActions.JOIN].includes(action);
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Livechat_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Livechat_Warning';
			default:
				return '';
		}
	}

	readOnly(rid) {
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

	getAvatarPath(roomData) {
		return getAvatarURL({ username: `@${ this.roomName(roomData) }` });
	}

	openCustomProfileTab(instance, room, username) {
		if (!room || !room.v || room.v.username !== username) {
			return false;
		}

		instance.tabBar.openUserInfo();
		return true;
	}

	showQuickActionButtons() {
		return true;
	}

	isLivechatRoom() {
		return true;
	}
}
