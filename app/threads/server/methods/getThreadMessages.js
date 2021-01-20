import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { canAccessRoom } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import { readThread } from '../functions';
import { Message } from '../../../../server/sdk';

const MAX_LIMIT = 100;

Meteor.methods({
	getThreadMessages({ tmid, limit, skip }) {
		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${ MAX_LIMIT }`, { method: 'getThreadMessages' });
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreadMessages' });
		}

		const thread = Promise.await(Message.getById({ msgId: tmid, userId: Meteor.userId }));
		if (!thread) {
			return [];
		}

		const user = Meteor.user();
		const room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		readThread({ userId: user._id, rid: thread.rid, tmid });

		const threadQueryOptions = {
			...skip && { skip },
			...limit && { limit },
			sort: { ts: -1 },
		};

		const result = Promise.await(Message.getThreadById({ tmid, queryOptions: threadQueryOptions }));

		return [thread, ...result];
	},
});
