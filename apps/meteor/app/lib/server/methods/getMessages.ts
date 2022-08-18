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
				rids.reduce<string[]>((prids, rid) => {
					const room = Rooms.findOneById(rid);

					if (room?.prid) {
						prids.push(room.prid);
					}

					return prids;
				}, []),
			),
		];

		if (!rids.every((_id) => canAccessRoomId(_id, uid)) || !prids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', 'getSingleMessage');
		}

		return msgs;
	},
});
