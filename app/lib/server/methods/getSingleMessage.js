import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../../authorization/server';
import { Messages } from '../../../models/server';

Meteor.methods({
	getSingleMessage(msgId) {
		check(msgId, String);

		const msg = Messages.findOneById(msgId);

		if (!msg || !msg.rid) {
			return undefined;
		}

		if (!canAccessRoom({ _id: msg.rid }, { _id: Meteor.userId() })) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msg;
	},
});
