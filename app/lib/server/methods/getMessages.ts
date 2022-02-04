import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../../authorization/server';
import { Messages } from '../../../models/server';
import { IMessage } from '../../../../definition/IMessage';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = Messages.findVisibleByIds(messages).fetch() as IMessage[];

		const user = { _id: uid };

		const rids = [...new Set(msgs.map((m) => m.rid))];

		if (!rids.every((_id) => canAccessRoom({ _id }, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
