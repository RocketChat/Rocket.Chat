import { Messages } from '../../../../../app/models/server/models/Messages';

Messages.prototype.createTransferFailedHistoryMessage = function (rid, comment, user, extraData) {
	const t = 'livechat_transfer_history_fallback';
	const record = {
		t,
		rid,
		ts: new Date(),
		comment,
		u: {
			_id: user._id,
			username: user.username,
		},
		groupable: false,
	};

	Object.assign(record, extraData);

	record._id = this.insertOrUpsert(record);
	return record;
};
