import { Meteor } from 'meteor/meteor';

export const livechatRoomManager = new Meteor.Streamer('livechat-room-manager');

livechatRoomManager.allowWrite('none');

livechatRoomManager.allowRead(function(rid) {
	try {
		const room = Meteor.call('canAccessRoom', rid, this.userId);

		if (!room) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
});

export function emitLivechatRoomManager(id, data) {
	if (!data) {
		return;
	}

	if (!data.t === 'l') {
		return;
	}

	livechatRoomManager.emit(id, data);
}
