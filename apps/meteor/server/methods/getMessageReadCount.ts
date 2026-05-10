import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { getMessageReadCount as getMessageReadCountHelper } from '../../app/read-counter/server/getMessageReadCount';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getMessageReadCount(options: { messageId: IMessage['_id'] }): { readCount: number } | null;
	}
}

Meteor.methods<ServerMethods>({
	async getMessageReadCount({ messageId }) {
		check(messageId, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessageReadCount' });
		}

		return getMessageReadCountHelper(messageId, uid);
	},
});

