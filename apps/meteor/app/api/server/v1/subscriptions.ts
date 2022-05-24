import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../../models/server/raw';
import { API } from '../api';

API.v1.addRoute(
	'subscriptions.get',
	{ authRequired: true },
	{
		async get() {
			const { updatedSince } = this.queryParams;

			let updatedSinceDate: Date | undefined;
			if (updatedSince) {
				if (isNaN(Date.parse(updatedSince))) {
					throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
				}
				updatedSinceDate = new Date(updatedSince);
			}

			const result = await Meteor.call('subscriptions/get', updatedSinceDate);

			return API.v1.success(
				Array.isArray(result)
					? {
							update: result,
							remove: [],
					  }
					: result,
			);
		},
	},
);

API.v1.addRoute(
	'subscriptions.getOne',
	{ authRequired: true },
	{
		async get() {
			const { roomId } = this.queryParams;

			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}

			return API.v1.success({
				subscription: await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId),
			});
		},
	},
);

/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */
API.v1.addRoute(
	'subscriptions.read',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				rid: String,
			});

			Meteor.call('readMessages', this.bodyParams.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subscriptions.unread',
	{ authRequired: true },
	{
		post() {
			const { roomId, firstUnreadMessage } = this.bodyParams;

			if (!roomId && firstUnreadMessage && !firstUnreadMessage._id) {
				return API.v1.failure('At least one of "roomId" or "firstUnreadMessage._id" params is required');
			}

			Meteor.call('unreadMessages', firstUnreadMessage, roomId);

			return API.v1.success();
		},
	},
);
