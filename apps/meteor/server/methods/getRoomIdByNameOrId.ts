// DEPRECATE
import { Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomIdByNameOrId(rid: string): string;
	}
}

Meteor.methods<ServerMethods>({
	async getRoomIdByNameOrId(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomIdByNameOrId',
			});
		}

		const room = (await Rooms.findOneById(rid)) || (await Rooms.findOneByName(rid));

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomIdByNameOrId',
			});
		}

		if (!(await canAccessRoomAsync(room, (await Meteor.userAsync()) ?? undefined))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomIdByNameOrId',
			});
		}

		return room._id;
	},
});
