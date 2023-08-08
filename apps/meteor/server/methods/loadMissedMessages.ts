import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadMissedMessages(rid: IRoom['_id'], ts: Date): Promise<false | IMessage[]>;
	}
}

Meteor.methods<ServerMethods>({
	async loadMissedMessages(rid, start) {
		check(rid, String);
		check(start, Date);

		const fromId = Meteor.userId() ?? undefined;

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (!(await canAccessRoomIdAsync(rid, fromId))) {
			return false;
		}

		return Messages.findVisibleByRoomIdAfterTimestamp(rid, start, {
			sort: {
				ts: -1,
			},
		}).toArray();
	},
});
