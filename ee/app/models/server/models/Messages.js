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

export default Messages;
