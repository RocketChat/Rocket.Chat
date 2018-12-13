import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatRoomType from '../lib/LivechatRoomType';
import LivechatVisitors from './models/LivechatVisitors';

class LivechatRoomTypeServer extends LivechatRoomType {
	getMsgSender(senderId) {
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
	getNotificationDetails(room, user, notificationMessage) {
		const title = `[livechat] ${ this.roomName(room) }`;
		const text = notificationMessage;

		return { title, text };
	}

	canAccessUploadedFile({ rc_token, rc_rid } = {}) {
		return rc_token && rc_rid && RocketChat.models.Rooms.findOneOpenByRoomIdAndVisitorToken(rc_rid, rc_token);
	}
}

RocketChat.roomTypes.add(new LivechatRoomTypeServer());
