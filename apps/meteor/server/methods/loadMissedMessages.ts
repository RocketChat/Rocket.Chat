import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadMissedMessages(rid: IRoom['_id'], ts: Date): IMessage[];
	}
}

Meteor.methods<ServerMethods>({
	loadMissedMessages(rid, start) {
		check(rid, String);
		check(start, Date);

		const fromId = Meteor.userId() ?? undefined;

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (!canAccessRoomId(rid, fromId)) {
			return false;
		}

		const options = {
			sort: {
				ts: -1,
			},
		};

		return Messages.findVisibleByRoomIdAfterTimestamp(rid, start, options).fetch();
	},
});
