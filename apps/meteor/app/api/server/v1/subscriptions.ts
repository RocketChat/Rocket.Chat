import { Subscriptions } from '@rocket.chat/models';
import {
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
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

			const result = await Meteor.callAsync('subscriptions/get', updatedSinceDate);

			// Include unread count in the response
			const subscriptionsWithUnread = Array.isArray(result)
				? result.map((subscription) => ({
						...subscription,
						unread: subscription.unread || 0, // Ensure the unread count is included
				  }))
				: result;

			return API.v1.success(
				Array.isArray(subscriptionsWithUnread)
					? {
							update: subscriptionsWithUnread,
							remove: [],
						}
					: subscriptionsWithUnread,
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

			// Fetch the subscription and include unread count
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);

			if (!subscription) {
				return API.v1.failure("Subscription not found for the given roomId.");
			}

			return API.v1.success({
				subscription: {
					...subscription,
					unread: subscription.unread || 0, // Add unread count
				},
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
		- roomId: Alternative for rid.
 */
API.v1.addRoute(
	'subscriptions.read',
	{
		authRequired: true,
		validateParams: isSubscriptionsReadProps,
	},
	{
		async post() {
			const { readThreads = false } = this.bodyParams;
			const roomId = 'rid' in this.bodyParams ? this.bodyParams.rid : this.bodyParams.roomId;

			await readMessages(roomId, this.userId, readThreads);

			// Fetch updated unread count after marking as read
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);

			return API.v1.success({
				unread: subscription?.unread || 0, // Updated unread count
			});
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
		async post() {
			const { firstUnreadMessage, roomId } = this.bodyParams;

			await Meteor.callAsync('unreadMessages', firstUnreadMessage, roomId);

			// Fetch updated unread count after marking as unread
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);

			return API.v1.success({
				unread: subscription?.unread || 0, // Updated unread count
			});
		},
	},
);
