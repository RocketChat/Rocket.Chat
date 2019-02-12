import { Users } from '..';
import _ from 'underscore';

const Subscriptions = {};

Object.assign(Subscriptions, {
	isUserInRole(userId, roleName, roomId) {
		if (roomId == null) {
			return false;
		}

		const query = {
			rid: roomId,
		};

		const subscription = this.findOne(query);

		return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleName);
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		if (scope) {
			query.rid = scope;
		}

		const subscriptions = this.find(query).fetch();

		const users = _.compact(_.map(subscriptions, function(subscription) {
			if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
				return subscription.u._id;
			}
		}));

		return Users.find({ _id: { $in: users } }, options);
	},
});

export { Subscriptions };
