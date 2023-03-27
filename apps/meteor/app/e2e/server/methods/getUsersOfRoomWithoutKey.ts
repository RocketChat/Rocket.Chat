import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { Users } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.getUsersOfRoomWithoutKey'(rid: IRoom['_id']): { users: Pick<IUser, '_id' | 'e2e'>[] };
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.getUsersOfRoomWithoutKey'(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		if (!(await canAccessRoomIdAsync(rid, userId))) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		const subscriptions = await Subscriptions.findByRidWithoutE2EKey(rid, {
			projection: { 'u._id': 1 },
		}).toArray();
		const userIds = subscriptions.map((s) => s.u._id);
		const options = { fields: { 'e2e.public_key': 1 } };

		const users = Users.findByIdsWithPublicE2EKey(userIds, options).fetch();

		return {
			users,
		};
	},
});
