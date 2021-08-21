import { Meteor } from 'meteor/meteor';

import { Messages, Rooms, Tasks } from '../../../models/server';
import { canAccessRoom } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import { readThread } from '../functions';

const MAX_LIMIT = 100;

Meteor.methods({
	getThreadMessages({ tmid, rid, limit, skip }) {
		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${ MAX_LIMIT }`, { method: 'getThreadMessages' });
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreadMessages' });
		}

		let room = rid ? Rooms.findOneById(rid) : false;

		let thread;
		if (room && room.taskRoomId) {
			thread = Tasks.findOneById(tmid);
			thread.msg = thread.title;
		} else {
			thread = Messages.findOneById(tmid);
		}

		if (!thread) {
			return [];
		}

		const user = Meteor.user();
		room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		readThread({ userId: user._id, rid: thread.rid, tmid });

		const result = Messages.findVisibleThreadByThreadId(tmid, { ...skip && { skip }, ...limit && { limit }, sort: { ts: -1 } }).fetch();

		return [thread, ...result];
	},
});
