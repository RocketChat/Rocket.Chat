import LivechatRoomType from '../imports/LivechatRoomType';
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

	allowFileUpload(allowData) {
		const { rc_token, rc_rid } = allowData;
		return rc_token && rc_rid && RocketChat.models.Rooms.findOneOpenByVisitorToken(rc_token, rc_rid);
	}
}

RocketChat.roomTypes.add(new LivechatRoomTypeServer());
