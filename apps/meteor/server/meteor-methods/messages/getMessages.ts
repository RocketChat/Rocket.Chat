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

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = await Messages.findVisibleByIds(messages).toArray();

		if (!msgs.length) {
			return msgs;
		}

		if (
			!(await canAccessRoomIdsAsync(
				msgs.map((m) => m.rid),
				user,
			))
		) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getMessages' });
		}

		return msgs;
	},
});
