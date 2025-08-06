import type { IRoom } from '@rocket.chat/core-typings';
import { Roles, Subscriptions, Users } from '@rocket.chat/models';
import _ from 'underscore';

import { settings } from '../../../app/settings/server';

export type RoomRoles = {
	rid: IRoom['_id'];
	u: {
		_id: string;
		username: string;
		name?: string;
	};
	roles: string[];
};

export async function getRoomRoles(rid: IRoom['_id']): Promise<RoomRoles[]> {
	const useRealName = settings.get('UI_Use_Real_Name') === true;

	const roles = await Roles.find({ scope: 'Subscriptions', description: { $exists: true, $ne: '' } }).toArray();
	const subscriptions = await Subscriptions.findByRoomIdAndRoles<RoomRoles>(rid, _.pluck(roles, '_id'), {
		sort: {
			'u.username': 1 as const,
		},
		projection: {
			rid: 1,
			u: 1,
			roles: 1,
		},
	}).toArray();

	if (!useRealName) {
		return subscriptions;
	}

	return Promise.all(
		subscriptions.map(async (subscription) => {
			const user = await Users.findOneById(subscription.u._id);
			subscription.u.name = user?.name;
			return subscription;
		}),
	);
}
