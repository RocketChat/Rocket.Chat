import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { Subscriptions, Users } from '../../../app/models/server';
import { shouldUseRealName } from '../../../app/utils/lib/shouldUseRealName';

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

	const uid = Meteor.userId();
	const user = uid ? Users.findOneById(uid, { projection: { settings: 1 } }) : undefined;
	const defaultMessagesLayout = settings.get<string>('Accounts_Default_User_Preferences_messagesLayout');
	const useRealName = shouldUseRealName(defaultMessagesLayout, user);

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
