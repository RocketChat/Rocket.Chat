import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Subscriptions, Users, Roles } from '../../../models';

Meteor.methods({
	getRoomRoles(rid) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		check(rid, String);

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

		const roles = Roles.find({ scope: 'Subscriptions', description: { $exists: 1, $ne: '' } }).fetch();
		const subscriptions = Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch();

		if (!UI_Use_Real_Name) {
			return subscriptions;
		}
		return subscriptions.map((subscription) => {
			const user = Users.findOneById(subscription.u._id);
			subscription.u.name = user && user.name;
			return subscription;
		});
	},
});
