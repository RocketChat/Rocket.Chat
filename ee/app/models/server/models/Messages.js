import { Messages } from '../../../../../app/models/server/models/Messages';
import { settings } from '../../../../../app/settings/server';

Messages.prototype.createPriorityHistoryWithRoomIdMessageAndUser = function(roomId, message, user, extraData) {
	const type = 'livechat_priority_history';
	const record = {
		t: type,
		rid: roomId,
		ts: new Date(),
		msg: message,
		u: {
			_id: user._id,
			username: user.username,
		},
		groupable: false,
	};

	if (settings.get('Message_Read_Receipt_Enabled')) {
		record.unread = true;
	}
	Object.assign(record, extraData);

	record._id = this.insertOrUpsert(record);
	return record;
};


Messages.prototype.createOnHoldHistoryWithRoomIdMessageAndUser = function(roomId, comment, user) {
	const type = 'livechat_placed_chat_on-hold';
	const record = {
		t: type,
		rid: roomId,
		ts: new Date(),
		comment,
		u: {
			_id: user._id,
			username: user.username,
		},
		groupable: false,
	};

	record._id = this.insertOrUpsert(record);
	return record;
};

Messages.prototype.createOnHoldResumedHistoryWithRoomIdMessageAndUser = function(roomId, comment, user) {
	const type = 'livechat_on-hold_chat_resumed';
	const record = {
		t: type,
		rid: roomId,
		ts: new Date(),
		comment,
		u: {
			_id: user._id,
			username: user.username,
		},
		groupable: false,
	};

	record._id = this.insertOrUpsert(record);
	return record;
};

export default Messages;
