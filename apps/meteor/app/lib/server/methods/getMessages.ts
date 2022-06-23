import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';

import { canAccessRoomId } from '../../../authorization/server';
import { Messages, Rooms } from '../../../models/server';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = Messages.findVisibleByIds(messages).fetch() as IMessage[];
		const rids = [...new Set(msgs.map((m) => m.rid))];
		const prids = [
			...new Set(
				rids
					.map((rid) => Rooms.findOneById(rid))
					.filter((room) => room.prid)
					.map((room) => room.prid),
			),
		];

		if (!rids.every((_id) => canAccessRoomId(_id, uid)) || !prids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
