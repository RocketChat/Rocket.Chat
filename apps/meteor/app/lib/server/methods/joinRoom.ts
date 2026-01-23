import { Room } from '@rocket.chat/core-services';
import { type IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		joinRoom(rid: IRoom['_id'], code?: string): boolean | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async joinRoom(rid, code) {
		check(rid, String);

		const user = await Meteor.userAsync();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		return Room.join({ room, user, ...(code ? { joinCode: code } : {}) });
	},
});
