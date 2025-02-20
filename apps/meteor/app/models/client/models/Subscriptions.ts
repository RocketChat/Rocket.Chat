import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { CachedChatSubscription } from './CachedChatSubscription';
import { isTruthy } from '../../../../lib/isTruthy';

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Subscriptions = Object.assign(CachedChatSubscription.collection, {
	isUserInRole: mem(
		function (this: typeof CachedChatSubscription.collection, _uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']) {
			if (!rid) {
				return false;
			}

			const query = {
				rid,
			};

			const subscription = this.findOne(query, { fields: { roles: 1 } });

			return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleId);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),

	findUsersInRoles: mem(
		function (this: typeof CachedChatSubscription.collection, roles: IRole['_id'][] | IRole['_id'], scope?: string, options?: any) {
			roles = Array.isArray(roles) ? roles : [roles];

			const query: Filter<any> = {
				roles: { $in: roles },
			};

			if (scope) {
				query.rid = scope;
			}

			const subscriptions = this.find(query).fetch();

			const uids = subscriptions
				.map((subscription) => {
					if (typeof subscription.u !== 'undefined' && typeof subscription.u._id !== 'undefined') {
						return subscription.u._id;
					}

					return undefined;
				})
				.filter(isTruthy);

			return Meteor.users.find({ _id: { $in: uids } }, options);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),
});
