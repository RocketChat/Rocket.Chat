import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { markAllMessagesAsDone } from '../functions/markAllMessagesAsDone';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		markAllMessagesAsDone(data: {
			roomId: string;
			userId: string
		}): void;
	}
}

Meteor.methods<ServerMethods>({
	async markAllMessagesAsDone({
		roomId,
		userId
	}) {
		check(roomId, String);
		check(userId, String);

		return markAllMessagesAsDone({
			rid: roomId,
			userId: userId
		}); 
	},
});
