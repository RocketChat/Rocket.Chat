import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../../authorization/server';
import { Messages } from '../../../models/server';
import { IMessage } from '../../../../definition/IMessage';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);

		const msgs = Messages.findVisibleByIds(messages).fetch();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const user = { _id: Meteor.userId()! || undefined };

		const rids = [...new Set(msgs.map((m: IMessage) => m.rid))] as undefined[];
		if (!rids.every((_id) => canAccessRoom({ _id }, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
