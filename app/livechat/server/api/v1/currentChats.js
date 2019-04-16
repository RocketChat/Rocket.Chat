import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { API } from '../../../../api';
import { hasPermission } from '../../../../authorization';
import { findOpenLiveChatRoom, findClosedLiveChatRoom, findAllLiveChatRoom } from '../lib/livechat';

API.v1.addRoute('livechat/current.chat/:status', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				status: String,
			});

			const { status } = this.urlParams;

			if (status.toLowerCase() === 'open') {
				const room = findOpenLiveChatRoom().map((data) => data);

				if (!room) {
					throw new Meteor.Error('invalid-room');
				}
				return API.v1.success({ room });
			} else if (status.toLowerCase() === 'closed') {
				const room = findClosedLiveChatRoom().map((data) => data);

				if (!room) {
					throw new Meteor.Error('invalid-room');
				}
				return API.v1.success({ room });
			} else if (status.toLowerCase() === 'all') {
				const room = findAllLiveChatRoom().map((data) => data);

				if (!room) {
					throw new Meteor.Error('invalid-room');
				}
				return API.v1.success({ room });
			}

			throw new Meteor.Error('invalid-status');
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
