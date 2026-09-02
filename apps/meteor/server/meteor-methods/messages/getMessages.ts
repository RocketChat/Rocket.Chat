import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdsAsync } from '../../lib/authorization/canAccessRoom';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getMessages(messages: IMessage['_id'][]): Promise<IMessage[]>;
	}
}

Meteor.methods<ServerMethods>({
	async getMessages(messages) {
		methodDeprecationLogger.method('getMessages', '9.0.0', '/v1/chat.getMessages');
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = await Messages.findVisibleByIds(messages).toArray();

		if (!(await canAccessRoomIdsAsync([...new Set(msgs.map((m) => m.rid))], this.userId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
