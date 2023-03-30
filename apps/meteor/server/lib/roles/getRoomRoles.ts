import _ from 'underscore';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Roles, Subscriptions } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { Users } from '../../../app/models/server';

export async function getRoomRoles(rid: IRoom['_id']): Promise<ISubscription[]> {
	const options = {
		sort: {
			'u.username': 1 as const,
		},
		projection: {
			rid: 1,
			u: 1,
			roles: 1,
		},
	};

	const useRealName = settings.get('UI_Use_Real_Name') === true;

	const roles = await Roles.find({ scope: 'Subscriptions', description: { $exists: true, $ne: '' } }).toArray();
	const subscriptions = await Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).toArray();

	if (!useRealName) {
		return subscriptions;
	}
	return subscriptions.map((subscription) => {
		const user = Users.findOneById(subscription.u._id);
		subscription.u.name = user?.name;
		return subscription;
	});
}
