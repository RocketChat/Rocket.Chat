import _ from 'underscore';
import mem from 'mem';

import { Users } from '..';

const Subscriptions = {};

Object.assign(Subscriptions, {
	isUserInRole: mem(
		/**
		 * @param {string} userId
		 * @param {IRole['_id']} roleId
		 * @param {string} roomId
		 */
		function (userId, roleId, roomId) {
			if (roomId == null) {
				return false;
			}

			const query = {
				rid: roomId,
			};

			const subscription = this.findOne(query, { fields: { roles: 1 } });

			return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleId);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),

	findUsersInRoles: mem(
		/**
		 * @param {IRole['_id'][]} roles the list of role ids
		 * @param {string} scope the value for the role scope (room id)
		 * @param {any} options
		 */
		function (roles, scope, options) {
			roles = [].concat(roles);

			const query = {
				roles: { $in: roles },
			};

			if (scope) {
				query.rid = scope;
			}

			const subscriptions = this.find(query).fetch();

			const users = _.compact(
				_.map(subscriptions, function (subscription) {
					if (typeof subscription.u !== 'undefined' && typeof subscription.u._id !== 'undefined') {
						return subscription.u._id;
					}
				}),
			);

			return Users.find({ _id: { $in: users } }, options);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),
});

export { Subscriptions };
