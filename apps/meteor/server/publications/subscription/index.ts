import type { ISubscription } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../../app/models/server';
import { subscriptionFields } from '../../modules/watchers/publishFields';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'subscriptions/get'(updatedAt?: Date): ISubscription[] | { update: ISubscription[]; remove: { _id: string; _deletedAt: Date }[] };
	}
}

Meteor.methods<ServerMethods>({
	'subscriptions/get'(updatedAt) {
		const uid = Meteor.userId();
		if (!uid) {
			return [];
		}

		const options = { fields: subscriptionFields };

		const records: ISubscription[] = Subscriptions.findByUserId(uid, options).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				}),
				remove: Subscriptions.trashFindDeletedAfter(
					updatedAt,
					{
						'u._id': uid,
					},
					{
						fields: {
							_id: 1,
							_deletedAt: 1,
						},
					},
				).fetch(),
			};
		}

		return records;
	},
});
