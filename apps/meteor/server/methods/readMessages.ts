import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server';
import { readMessages } from '../lib/readMessages';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		readMessages(rid: string, readThreads?: boolean): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async readMessages(rid, readThreads = false) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		const user = ((await Meteor.userAsync()) as IUser | null) ?? undefined;
		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-room-does-not-exist', 'This room does not exist', { method: 'readMessages' });
		}
		if (!(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readMessages' });
		}

		await readMessages(rid, userId, readThreads);
	},
});
