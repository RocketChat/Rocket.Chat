import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { Messages } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSingleMessage(mid: IMessage['_id']): IMessage;
	}
}

Meteor.methods<ServerMethods>({
	async getSingleMessage(mid) {
		check(mid, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getSingleMessage' });
		}

		const msg = Messages.findOneById(mid);

		if (!msg?.rid) {
			return undefined;
		}

		if (!(await canAccessRoomIdAsync(msg.rid, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msg;
	},
});
