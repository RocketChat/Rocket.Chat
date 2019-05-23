import { Users } from '..';

import _ from 'underscore';
import mem from 'mem';

const Subscriptions = {};

Object.assign(Subscriptions, {
	isUserInRole: mem(function(userId, roleName, roomId) {
		if (roomId == null) {
			return false;
		}

		const query = {
			rid: roomId,
		};

		const subscription = this.findOne(query, { fields: { roles: 1 } });

		return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleName);
	}, { maxAge: 1000 }),

	findUsersInRoles: mem(function(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		if (scope) {
			query.rid = scope;
		}

		const subscriptions = this.find(query).fetch();

		const users = _.compact(_.map(subscriptions, function(subscription) {
			if (typeof subscription.u !== 'undefined' && typeof subscription.u._id !== 'undefined') {
				return subscription.u._id;
			}
		}));

		return Users.find({ _id: { $in: users } }, options);
	}, { maxAge: 1000 }),
});

export { Subscriptions };
