import { Meteor } from 'meteor/meteor';

import { Messages } from '../../app/models/client';
import { LegacyRoomManager } from '../../app/ui-utils/client';

Meteor.startup(() => {
	Messages.find().observe({
		removed(record) {
			if (!LegacyRoomManager.getOpenedRoomByRid(record.rid)) {
				return;
			}

			const recordBefore = Messages.findOne({ ts: { $lt: record.ts } }, { sort: { ts: -1 } });
			if (recordBefore) {
				Messages.update({ _id: recordBefore._id }, { $set: { tick: new Date() } });
			}

			const recordAfter = Messages.findOne({ ts: { $gt: record.ts } }, { sort: { ts: 1 } });
			if (recordAfter) {
				return Messages.update({ _id: recordAfter._id }, { $set: { tick: new Date() } });
			}
		},
	});
});
