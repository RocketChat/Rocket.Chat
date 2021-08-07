import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../../models';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);

		const cache = {};

		return messages.map((msgId) => {
			const msg = Messages.findOneById(msgId);

			if (!msg || !msg.rid) {
				return undefined;
			}

			cache[msg.rid] = cache[msg.rid] || Meteor.call('canAccessRoom', msg.rid, Meteor.userId());

			if (!cache[msg.rid]) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
			}

			return msg;
		});
	},
});
