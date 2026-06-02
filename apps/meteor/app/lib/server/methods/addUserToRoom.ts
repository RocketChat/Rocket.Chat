import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { addUsersToRoomMethod } from './addUsersToRoom';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addUserToRoom(data: { rid: string; username: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	async addUserToRoom(data) {
		methodDeprecationLogger.method('addUserToRoom', '9.0.0', ['/v1/channels.invite', '/v1/groups.invite']);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUserToRoom',
			});
		}

		await addUsersToRoomMethod(userId, {
			rid: data.rid,
			users: [data.username],
		});
	},
});
