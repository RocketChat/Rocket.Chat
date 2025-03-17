import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { getRoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { canAccessRoomAsync } from '../../../authorization/server';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomRoles(rid: IRoom['_id']): ISubscription[];
	}
}

export const executeGetRoomRoles = async (rid: IRoom['_id'], fromUserId?: string | null) => {
	check(rid, String);

	if (!fromUserId && settings.get('Accounts_AllowAnonymousRead') === false) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomRoles' });
	}

	if (fromUserId && !(await canAccessRoomAsync(room, { _id: fromUserId }))) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
	}

	return getRoomRoles(rid);
};

Meteor.methods<ServerMethods>({
	async getRoomRoles(rid) {
		const fromUserId = Meteor.userId();

		return executeGetRoomRoles(rid, fromUserId);
	},
});
