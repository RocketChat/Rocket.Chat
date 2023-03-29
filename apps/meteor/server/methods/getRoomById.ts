import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Rooms } from '../../app/models/server';
import { canAccessRoomAsync } from '../../app/authorization/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomById(rid: IRoom['_id']): IRoom;
	}
}

Meteor.methods<ServerMethods>({
	async getRoomById(rid) {
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
		if (!(await canAccessRoomAsync(room, (await Meteor.userAsync()) as IUser))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomById',
			});
		}
		return room;
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'getRoomById',
		userId() {
			return true;
		},
	},
	10,
	60000,
);
