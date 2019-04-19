import { Rooms } from '../../models';
import { roomTypes } from '../../utils';
import LivechatRoomType from '../lib/LivechatRoomType';
import { LivechatVisitors } from '../../models';

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
		return rc_token && rc_rid && Rooms.findOneOpenByRoomIdAndVisitorToken(rc_rid, rc_token);
	}

	getReadReceiptsExtraData(message) {
		const { token } = message;
		return { token };
	}
}

roomTypes.add(new LivechatRoomTypeServer());
