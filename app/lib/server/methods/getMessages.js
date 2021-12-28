import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoomId } from '../../../authorization/server';
import { Messages } from '../../../models/server';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);

		const msgs = Messages.findVisibleByIds(messages).fetch();

		const uid = Meteor.userId();

		const rids = [...new Set(msgs.map((m) => m.rid))];
		if (!rids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
