import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import mem from 'mem';

import { CachedChatSubscription } from './CachedChatSubscription';

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Subscriptions = Object.assign(CachedChatSubscription.collection, {
	isUserInRole: mem(
		function (this: typeof CachedChatSubscription.collection, _uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']) {
			if (!rid) {
				return false;
			}

			const subscription = this.state.find((record) => record.rid === rid);

			return subscription && Array.isArray(subscription.roles) && subscription.roles.includes(roleId);
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	),
});
