import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom } from '../../models';
import { settings } from '../../settings';
import { hasPermission } from '../../authorization';
import { openRoom } from '../../ui-utils';
import { RoomSettingsEnum, UiTextContext, RoomTypeRouteConfig, RoomTypeConfig } from '../../utils';
import { getAvatarURL } from '../../utils/lib/getAvatarURL';

let getLivechatInquiryCollection;
if (Meteor.isClient) {
	({ getLivechatInquiryCollection } = require('../client/collections/LivechatInquiry'));
}

class OmnichannelRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'omnichannel',
			path: '/omnichannel/:id',
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

export default class OmnichannelRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'l',
			order: 5,
			icon: 'omnichannel',
			label: 'Omnichannel',
			route: new OmnichannelRoomRoute(),
		});

		this.notSubscribedTpl = 'omnichannelNotSubscribed';
		this.readOnlyTpl = 'omnichannelReadOnly';
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
		const inquiry = getLivechatInquiryCollection().findOne({ rid });
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

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Omnichannel_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Omnichannel_Warning';
			default:
				return '';
		}
	}

	readOnly(rid, user) {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { open: 1, servedBy: 1 } });
		if (!room || !room.open) {
			return true;
		}

		const inquiry = getLivechatInquiryCollection().findOne({ rid }, { fields: { status: 1 } });
		if (inquiry && inquiry.status === 'queued') {
			return true;
		}

		return (!room.servedBy || room.servedBy._id !== user._id) && !hasPermission('view-livechat-rooms');
	}

	getAvatarPath(roomData) {
		return getAvatarURL({ username: `@${ this.roomName(roomData) }` });
	}
}
