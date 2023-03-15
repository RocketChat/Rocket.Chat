import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';

import { canAccessRoomId } from '../../../authorization/server';
import { Messages } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getMessages(messages: IMessage['_id'][]): IMessage[];
	}
}

Meteor.methods({
	getMessages(messages) {
		check(messages, [String]);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getMessages' });
		}

		const msgs = Messages.findVisibleByIds(messages).fetch() as IMessage[];
		const rids = [...new Set(msgs.map((m) => m.rid))];

		if (!rids.every((_id) => canAccessRoomId(_id, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msgs;
	},
});
