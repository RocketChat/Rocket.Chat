import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { getRoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { canAccessRoomAsync } from '../../../authorization/server';
import { Rooms } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomRoles(rid: IRoom['_id']): ISubscription[];
	}
}

Meteor.methods<ServerMethods>({
	async getRoomRoles(rid) {
		check(rid, String);
		const fromUserId = Meteor.userId();

		if (!fromUserId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomRoles' });
		}

		if (fromUserId && !(await canAccessRoomAsync(room, { _id: fromUserId }))) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		return getRoomRoles(rid);
	},
});
