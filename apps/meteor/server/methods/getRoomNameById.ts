import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomNameById(rid: IRoom['_id']): Promise<string | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async getRoomNameById(rid) {
		check(rid, String);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameById',
			});
		}

		const room = await Rooms.findOneById(rid);

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, {
			projection: { _id: 1 },
		});
		if (subscription) {
			return room.name;
		}

		if (room.t !== 'c' || (await hasPermissionAsync(userId, 'view-c-room')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById',
			});
		}

		return room.name;
	},
});
