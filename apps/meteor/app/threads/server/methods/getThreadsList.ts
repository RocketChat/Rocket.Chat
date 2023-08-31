import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../../authorization/server';
import { settings } from '../../../settings/server';

const MAX_LIMIT = 100;

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getThreadsList(params: { rid: IRoom['_id']; limit?: number; skip?: number }): IMessage[];
	}
}

Meteor.methods<ServerMethods>({
	async getThreadsList({ rid, limit = 50, skip = 0 }) {
		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${MAX_LIMIT}`, {
				method: 'getThreadsList',
			});
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreadsList' });
		}

		const user = await Meteor.userAsync();
		const room = await Rooms.findOneById(rid);

		if (!user || !room || !(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed', { method: 'getThreadsList' });
		}

		return Messages.findThreadsByRoomId(rid, skip, limit).toArray();
	},
});
