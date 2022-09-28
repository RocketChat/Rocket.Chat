import _ from 'underscore';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import type { IRole, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

const Subscriptions = {
	isUserInRole: mem(
		/**
		 * @param {string} userId
		 * @param {IRole['_id']} roleId
		 * @param {string} roomId
		 */
		function (this: Mongo.Collection<ISubscription>, _userId: IUser['_id'], roleId: IRole['_id'], roomId: IRoom['_id']) {
			if (!roomId) {
				return false;
			}

			const query: Mongo.Selector<ISubscription> = {
				rid: roomId,
			};

			const subscription = this.findOne(query, { fields: { roles: 1 } });

			return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleId);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),

	findUsersInRoles: mem(
		function (
			this: Mongo.Collection<ISubscription>,
			roles: IRole['_id'] | IRole['_id'][],
			scope: string,
			options: Mongo.Options<Meteor.User>,
		) {
			roles = ([] as IRole['_id'][]).concat(roles);

			const query: Mongo.Selector<ISubscription> = {
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

			return Meteor.users.find({ _id: { $in: users } }, options);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),
} as const;

export { Subscriptions };
