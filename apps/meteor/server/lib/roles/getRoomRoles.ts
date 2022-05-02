import _ from 'underscore';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { Subscriptions, Users } from '../../../app/models/server';
import { Roles } from '../../../app/models/server/raw';

export function getRoomRoles(rid: IRoom['_id']): ISubscription[] {
	const options = {
		sort: {
			'u.username': 1,
		},
		fields: {
			rid: 1,
			u: 1,
			roles: 1,
		},
	};

	const useRealName = settings.get('UI_Use_Real_Name') === true;

	const roles = Promise.await(Roles.find({ scope: 'Subscriptions', description: { $exists: true, $ne: '' } }).toArray());
	const subscriptions = Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch() as ISubscription[];

	if (!useRealName) {
		return subscriptions;
	}
	return subscriptions.map((subscription) => {
		const user = Users.findOneById(subscription.u._id);
		subscription.u.name = user?.name;
		return subscription;
	});
}
