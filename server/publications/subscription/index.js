import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../../app/models';
import { subscriptionFields } from '../../modules/watchers/watchers.module';

Meteor.methods({
	'subscriptions/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}

		const options = { fields: subscriptionFields };

		const records = Subscriptions.findByUserId(Meteor.userId(), options).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function (record) {
					return record._updatedAt > updatedAt;
				}),
				remove: Subscriptions.trashFindDeletedAfter(
					updatedAt,
					{
						'u._id': Meteor.userId(),
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
