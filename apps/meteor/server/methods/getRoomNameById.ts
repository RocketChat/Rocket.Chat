import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom } from '@rocket.chat/core-typings';

import { Rooms, Subscriptions } from '../../app/models/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomNameById(rid: IRoom['_id']): string;
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

		const room = Rooms.findOneById(rid);

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, userId, {
			fields: { _id: 1 },
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
