import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../../authorization/server';
import { Messages } from '../../../models/server';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);

		const msgs = Messages.findVisibleByIds(messages).fetch();

		const user = { _id: Meteor.userId() };

		const rids = [...new Set(msgs.map((m) => m.rid))];
		if (!rids.every((_id) => canAccessRoom({ _id }, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
