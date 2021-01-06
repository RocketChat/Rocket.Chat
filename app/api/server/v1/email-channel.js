import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { API } from '../api';
import { find, findOne } from '../lib/email-channel';

API.v1.addRoute('email-channel.list', { authRequired: true }, {
	get() {
		try {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const emailChannels = Promise.await(find({ userId: this.userId, pagination: { offset, count, sort } }));
			return API.v1.success(emailChannels);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});


API.v1.addRoute('email-channel', { authRequired: true }, {
	get() {
		try {
			check(this.queryParams, {
				id: String,
			});
			const { id } = this.queryParams;

			const emailChannel = Promise.await(findOne({ userId: this.userId, id }));

			if (!emailChannel) {
				throw new Meteor.Error('email-channel-not-found');
			}

			return API.v1.success(emailChannel);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
