import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadNextMessages(rid: IRoom['_id'], end?: Date, limit?: number): { messages: IMessage[] };
	}
}

Meteor.methods({
	loadNextMessages(rid, end, limit = 20) {
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

		if (!fromId || !canAccessRoomId(rid, fromId)) {
			return false;
		}

		const options = {
			sort: {
				ts: 1,
			},
			limit,
		};

		let records;
		if (end) {
			records = Messages.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch();
		} else {
			records = Messages.findVisibleByRoomId(rid, options).fetch();
		}

		return {
			messages: normalizeMessagesForUser(records, fromId),
		};
	},
});
