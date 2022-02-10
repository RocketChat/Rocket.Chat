import { ChatRoom } from '../../models';
import { settings } from '../../settings';
import { hasPermission } from '../../authorization';
import { openRoom } from '../../ui-utils';
import { RoomTypeRouteConfig, RoomTypeConfig } from '../../utils';
import { getAvatarURL } from '../../utils/lib/getAvatarURL';

class VoipRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'voip',
			path: '/voip/:id/:tab?/:context?',
		});
	}

	action(params) {
		openRoom('v', params.id);
	}

	link(sub) {
		return {
			id: sub._id,
		};
	}
}

export default class VoipRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'v',
			order: 6,
			icon: 'phone',
			label: 'Voip',
			route: new VoipRoomRoute(),
		});

		this.notSubscribedTpl = 'livechatNotSubscribed';
		this.readOnlyTpl = 'ComposerNotAvailablePhoneCalls';
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

	canSendMessage() {
		return false;
	}

	getUserStatus() {
		return 'online';
	}

	readOnly() {
		return true;
	}

	getAvatarPath(roomData) {
		return getAvatarURL({ username: `@${this.roomName(roomData)}` });
	}
}
