import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getMessages(messages: IMessage['_id'][]): Promise<IMessage[]>;
	}
}

Meteor.methods<ServerMethods>({
	async getMessages(messages) {
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = await Messages.findVisibleByIds(messages).toArray();
		const rids = await Promise.all([...new Set(msgs.map((m) => m.rid))].map((_id) => canAccessRoomIdAsync(_id, uid)));

		if (!rids.every(Boolean)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
