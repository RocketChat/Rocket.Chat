import _ from 'underscore';

import { settings } from '../../../settings';
import { Subscriptions, Users } from '../../../models';
import { Roles } from '../../../models/server/raw';

export function getRoomRoles(rid) {
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

	const UI_Use_Real_Name = settings.get('UI_Use_Real_Name') === true;

	const roles = Promise.await(Roles.find({ scope: 'Subscriptions', description: { $exists: 1, $ne: '' } }).toArray());
	const subscriptions = Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch();

	if (!UI_Use_Real_Name) {
		return subscriptions;
	}
	return subscriptions.map((subscription) => {
		const user = Users.findOneById(subscription.u._id);
		subscription.u.name = user && user.name;
		return subscription;
	});
}
