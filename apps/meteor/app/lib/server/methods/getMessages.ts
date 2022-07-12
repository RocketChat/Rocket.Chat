import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';

import { canAccessRoomId } from '../../../authorization/server';
import { Messages, Rooms } from '../../../models/server';
import { P } from 'pino';

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = Messages.findVisibleByIds(messages).fetch() as IMessage[];
		const rids = [...new Set(msgs.map((m) => m.rid))];
		const prids = rids.reduce<string[]>((prids, rid) => {
			return Rooms.findOneById(rid).then((room) => {
				if (room.prid) {
					prids.push(room.prid);
				}

				return prids;
			});
		}, []);

		if (!rids.every((_id) => canAccessRoomId(_id, uid)) || !prids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', 'getSingleMessage');
		}

		return msgs;
	},
});
