import { Session } from 'meteor/session';

import { ChatRoom, Subscriptions } from '../../../models';
import { openRoom } from '../../../ui-utils';
import { RoomTypeConfig, RoomTypeRouteConfig } from '../../../utils';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';

export class DirectMessageRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'direct',
			path: '/direct/:rid/:tab?/:context?',
		});
	}

	action(params) {
		return openRoom('d', params.rid);
	}

	link(sub) {
		return { rid: sub.rid || sub.name };
	}
}

export class DirectMessageRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'd',
			order: 50,
			icon: 'at',
			label: 'Direct_Messages',
			route: new DirectMessageRoomRoute(),
		});
	}

	findRoom(identifier) {
		if (!hasPermission('view-d-room')) {
			return null;
		}

		const query = {
			t: 'd',
			$or: [{ name: identifier }, { rid: identifier }],
		};

		const subscription = Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	}

	secondaryRoomName(roomData) {
		if (settings.get('UI_Use_Real_Name')) {
			const subscription = Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
	}

	getUserStatusText(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${subscription.name}_status_text`);
	}

	enableMembersListProfile() {
		return true;
	}

	userDetailShowAll(/* room */) {
		return true;
	}
}
