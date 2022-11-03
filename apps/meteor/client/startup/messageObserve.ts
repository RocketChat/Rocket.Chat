import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { RoomManager } from '../../app/ui-utils/client';

Meteor.startup(() => {
	ChatMessage.find().observe({
		removed(record) {
			if (!RoomManager.getOpenedRoomByRid(record.rid)) {
				return;
			}

			const recordBefore = ChatMessage.findOne({ ts: { $lt: record.ts } }, { sort: { ts: -1 } });
			if (recordBefore) {
				ChatMessage.update({ _id: recordBefore._id }, { $set: { tick: new Date() } });
			}

			const recordAfter = ChatMessage.findOne({ ts: { $gt: record.ts } }, { sort: { ts: 1 } });
			if (recordAfter) {
				return ChatMessage.update({ _id: recordAfter._id }, { $set: { tick: new Date() } });
			}
		},
	});
});
