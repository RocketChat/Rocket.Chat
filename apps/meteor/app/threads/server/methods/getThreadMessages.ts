import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { canAccessRoomAsync } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import { readThread } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getThreadMessages(params: { tmid: IMessage['_id']; limit?: number; skip?: number }): Promise<IMessage[]>;
	}
}

const MAX_LIMIT = 100;

Meteor.methods<ServerMethods>({
	async getThreadMessages({ tmid, limit, skip }) {
		if ((limit ?? 0) > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${MAX_LIMIT}`, {
				method: 'getThreadMessages',
			});
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', {
				method: 'getThreadMessages',
			});
		}

		const thread = await Messages.findOneById(tmid);
		if (!thread) {
			return [];
		}

		const user = await Meteor.userAsync();
		const room = await Rooms.findOneById(thread.rid);

		if (!user || !room || !(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		if (!thread.tcount) {
			return [];
		}

		await callbacks.run('beforeReadMessages', thread.rid, user._id);
		await readThread({ userId: user._id, rid: thread.rid, tmid });

		const result = await Messages.findVisibleThreadByThreadId(tmid, {
			...(skip && { skip }),
			...(limit && { limit }),
			sort: { ts: -1 },
		}).toArray();
		callbacks.runAsync('afterReadMessages', room._id, { uid: user._id, tmid });

		return [thread, ...result];
	},
});
