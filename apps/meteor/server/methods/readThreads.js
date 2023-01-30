import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings/server';
import { Messages, Rooms } from '../../app/models/server';
import { canAccessRoom } from '../../app/authorization/server';
import { readThread } from '../../app/threads/server/functions';
import { callbacks } from '../../lib/callbacks';

Meteor.methods({
	readThreads(tmid) {
		check(tmid, String);

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', {
				method: 'getThreadMessages',
			});
		}

		const thread = Messages.findOneById(tmid);
		if (!thread) {
			return;
		}

		const user = Meteor.user();
		callbacks.run('beforeReadMessages', thread.rid, user._id);

		const room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		readThread({ userId: user._id, rid: thread.rid, tmid });
		callbacks.runAsync('afterReadMessages', room._id, { uid: user._id, tmid });
	},
});
