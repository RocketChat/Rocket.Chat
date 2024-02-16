import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import {
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { isSubscriptionsExistsProps } from '@rocket.chat/rest-typings/src';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
import { canAccessRoomAsync } from '../../../authorization/server';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
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
			await Meteor.callAsync('unreadMessages', (this.bodyParams as any).firstUnreadMessage, (this.bodyParams as any).roomId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subscriptions.exists',
	{
		authRequired: true,
		validateParams: isSubscriptionsExistsProps,
	},
	{
		async get() {
			const { username, roomId, userId, roomName } = this.queryParams;
			const [room, user] = await Promise.all([
				Rooms.findOneByIdOrName(roomId || roomName),
				Users.findOneByIdOrUsername(userId || username),
			]);
			if (!room?._id) {
				return API.v1.failure('error-room-not-found');
			}
			if (!user?._id) {
				return API.v1.failure('error-user-not-found');
			}

			if (room.broadcast && !(await hasPermissionAsync(this.userId, 'view-broadcast-member-list', room._id))) {
				return API.v1.unauthorized();
			}

			if ((await canAccessRoomAsync(room, this.user)) || (await canAccessRoomIdAsync(room._id, this.userId))) {
				return API.v1.success({ exists: (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) > 0 });
			}
			return API.v1.unauthorized();
		},
	},
);
