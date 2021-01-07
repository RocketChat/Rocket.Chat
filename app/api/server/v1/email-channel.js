import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { find, findOne } from '../lib/email-channel';
import { EmailChannel, Users } from '../../../models';

API.v1.addRoute('email-channel.list', { authRequired: true }, {
	get() {
		try {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailChannels = Promise.await(find({ userId: this.userId, query, pagination: { offset, count, sort } }));
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
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				name: String,
				email: String,
				active: Boolean,
				description: String,
				senderInfo: Match.Maybe(String),
				department: String,
				smtp: Object,
				imap: Object,
			});
			const emailChannelParams = this.bodyParams;
			emailChannelParams.ts = new Date();
			emailChannelParams._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });

			const emailChannel = EmailChannel.create(emailChannelParams);
			return API.v1.success(emailChannel);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
