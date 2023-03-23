import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Rooms } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomJoinCode(rid: string): string;
	}
}

Meteor.methods<ServerMethods>({
	async getRoomJoinCode(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getJoinCode' });
		}

		if (!(await hasPermissionAsync(userId, 'view-join-code'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'getJoinCode' });
		}

		const [room] = Rooms.findById(rid).fetch();

		return room?.joinCode;
	},
});
