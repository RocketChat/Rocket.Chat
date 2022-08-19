import { Meteor } from 'meteor/meteor';
import {
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { Subscriptions } from '@rocket.chat/models';

import { API } from '../api';

API.v1.addRoute(
	'subscriptions.get',
	{
		authRequired: true,
		validateParams: isSubscriptionsGetProps,
	},
	{
		async get() {
			const { updatedSince } = this.queryParams;

			let updatedSinceDate: Date | undefined;
			if (updatedSince) {
				if (isNaN(Date.parse(updatedSince as string))) {
					throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
				}
				updatedSinceDate = new Date(updatedSince as string);
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
	{
		authRequired: true,
		validateParams: isSubscriptionsGetOneProps,
	},
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
	{
		authRequired: true,
		validateParams: isSubscriptionsReadProps,
	},
	{
		post() {
			Meteor.call('readMessages', this.bodyParams.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subscriptions.unread',
	{
		authRequired: true,
		validateParams: isSubscriptionsUnreadProps,
	},
	{
		post() {
			Meteor.call('unreadMessages', (this.bodyParams as any).firstUnreadMessage, (this.bodyParams as any).roomId);

			return API.v1.success();
		},
	},
);
