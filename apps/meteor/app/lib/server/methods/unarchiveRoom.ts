import { isRegisterUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { unarchiveRoom } from '../functions/unarchiveRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unarchiveRoom(rid: string): Promise<void>;
	}
}

export const executeUnarchiveRoom = async (userId: string, rid: string) => {
	check(rid, String);

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!user || !isRegisterUser(user)) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
	}

	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'unarchiveRoom' });
	}

	if (!(await hasPermissionAsync(userId, 'unarchive-room', room._id))) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'unarchiveRoom' });
	}

	return unarchiveRoom(rid, user);
};

Meteor.methods<ServerMethods>({
	async unarchiveRoom(rid) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unarchiveRoom' });
		}

		return executeUnarchiveRoom(userId, rid);
	},
});
