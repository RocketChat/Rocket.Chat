import { Subscriptions } from '@rocket.chat/models';
import {
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
import { getSubscriptions } from '../../../../server/publications/subscription';
import { unreadMessages } from '../../../message-mark-as-unread/server/unreadMessages';
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

			const result = await getSubscriptions(this.userId, updatedSinceDate);

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
		async post() {
			await unreadMessages(
				this.userId,
				'firstUnreadMessage' in this.bodyParams ? this.bodyParams.firstUnreadMessage : undefined,
				'roomId' in this.bodyParams ? this.bodyParams.roomId : undefined,
			);

			return API.v1.success();
		},
	},
);
