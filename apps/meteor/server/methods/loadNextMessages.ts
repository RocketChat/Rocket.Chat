import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadNextMessages(rid: IRoom['_id'], end?: Date, limit?: number): Promise<{ messages: IMessage[] }>;
	}
}

Meteor.methods<ServerMethods>({
	async loadNextMessages(rid, end, limit = 20) {
		check(rid, String);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadNextMessages',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'loadNextMessages' });
		}

		const fromId = Meteor.userId();

		if (!fromId || !(await canAccessRoomIdAsync(rid, fromId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'loadNextMessages' });
		}

		let records;
		if (end) {
			records = await Messages.findVisibleByRoomIdAfterTimestamp(rid, end, {
				sort: {
					ts: 1,
				},
				limit,
			}).toArray();
		} else {
			records = await Messages.findVisibleByRoomId(rid, {
				sort: {
					ts: 1,
				},
				limit,
			}).toArray();
		}

		return {
			messages: await normalizeMessagesForUser(records, fromId),
		};
	},
});
