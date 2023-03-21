import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { settings } from '../../app/settings/server';
import { Messages, Rooms } from '../../app/models/server';
import { canAccessRoomAsync } from '../../app/authorization/server';
import { readThread } from '../../app/threads/server/functions';
import { callbacks } from '../../lib/callbacks';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		readThreads(tmid: IMessage['_id']): void;
	}
}

Meteor.methods<ServerMethods>({
	async readThreads(tmid) {
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

		const user = Meteor.user() ?? undefined;

		const room = Rooms.findOneById(thread.rid);

		if (!(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		callbacks.run('beforeReadMessages', thread.rid, user?._id);
		readThread({ userId: user?._id, rid: thread.rid, tmid });
		if (user?._id) {
			callbacks.runAsync('afterReadMessages', room._id, { uid: user._id, tmid });
		}
	},
});
