import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../../models';
import { API } from '../api';

API.v1.addRoute('subscriptions.get', { authRequired: true }, {
	get() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('subscriptions/get', updatedSinceDate); });

		if (Array.isArray(result)) {
			result = {
				update: result,
				remove: [],
			};
		}

		return API.v1.success(result);
	},
});

API.v1.addRoute('subscriptions.getOne', { authRequired: true }, {
	get() {
		const { roomId } = this.requestParams();

		if (!roomId) {
			return API.v1.failure('The \'roomId\' param is required');
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);

		return API.v1.success({
			subscription,
		});
	},
});

/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 		- roomId: Alternative for rid.
 */
API.v1.addRoute('subscriptions.read', { authRequired: true }, {
	post() {
		const { rid, roomId } = this.bodyParams;
		if (!rid && !roomId) {
			return API.v1.failure('At least one of "rid" or "roomId" params is required');
		}

		if (rid && roomId && (rid !== roomId)) {
			return API.v1.failure('Params reference to different rooms, use only one param or both params with the same room id');
		}

		let finalRoomId = '';
		rid && !roomId
			? finalRoomId = rid
			: finalRoomId = roomId;

		Meteor.runAsUser(this.userId, () =>
			Meteor.call('readMessages', finalRoomId),
		);

		return API.v1.success();
	},
});

API.v1.addRoute('subscriptions.unread', { authRequired: true }, {
	post() {
		const { roomId, firstUnreadMessage } = this.bodyParams;
		if (!roomId && (firstUnreadMessage && !firstUnreadMessage._id)) {
			return API.v1.failure('At least one of "roomId" or "firstUnreadMessage._id" params is required');
		}

		Meteor.runAsUser(this.userId, () =>
			Meteor.call('unreadMessages', firstUnreadMessage, roomId),
		);

		return API.v1.success();
	},
});
