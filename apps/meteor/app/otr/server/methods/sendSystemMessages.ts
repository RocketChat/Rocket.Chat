import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendSystemMessages(rid: string, user: string, id: string): void;
	}
}

Meteor.methods<ServerMethods>({
	sendSystemMessages(rid, user, id) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendSystemMessages' });
		}
		Messages.createOtrSystemMessagesWithRoomIdAndUser(rid, user, id);
	},
});
