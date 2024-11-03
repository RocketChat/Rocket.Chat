import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../../authorization/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUserMentionsByChannel(params: { roomId: string; options: { limit: number; sort: { ts: -1 | 1 } } }): IMessage[];
	}
}

Meteor.methods<ServerMethods>({
	async getUserMentionsByChannel({ roomId, options }) {
		check(roomId, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUserMentionsByChannel',
			});
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const room = await Rooms.findOneById(roomId);

		if (!room || !(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'getUserMentionsByChannel',
			});
		}

		return Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).toArray();
	},
});
