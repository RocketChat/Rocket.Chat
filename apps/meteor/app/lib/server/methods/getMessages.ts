import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

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

		if (!rids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		const rooms = Rooms.findByIds(rids, { fields: { prid: 1 } }).fetch();
		const prids = rooms.map((r: IRoom) => r.prid).filter(Boolean);

		if (!prids.every((_id: string) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
