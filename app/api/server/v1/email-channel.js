import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { findEmailChannels, findOneEmailChannel } from '../lib/emailChannel';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { EmailChannel, Users } from '../../../models';

API.v1.addRoute('email-channel.list', { authRequired: true }, {
	get() {
		try {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailChannels = Promise.await(findEmailChannels({ userId: this.userId, query, pagination: { offset, count, sort } }));
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
				_id: Match.Maybe(String),
			});
			const { _id } = this.queryParams;

			const emailChannel = Promise.await(findOneEmailChannel({ userId: this.userId, _id }));

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
				description: Match.Maybe(String),
				senderInfo: Match.Maybe(String),
				department: Match.Maybe(String),
				smtp: Object,
				imap: Object,
			});

			const emailChannelParams = this.bodyParams;

			if (!hasPermissionAsync(this.userId, 'manage-email-channels')) {
				throw new Error('error-not-allowed');
			}
			const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailChannelParams;
			if (!_id) {
				emailChannelParams.ts = new Date();
				emailChannelParams._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
				return EmailChannel.create(emailChannelParams);
			}
			const updateEmailChannel = {
				$set: { },
			};

			const emailChannel = Promise.await(findOneEmailChannel({ userId: this.userId, id: _id }));

			if (!emailChannel) {
				throw new Error('error-invalid-email-channel');
			}

			updateEmailChannel.$set.active = active;
			updateEmailChannel.$set.name = name;
			updateEmailChannel.$set.email = email;
			updateEmailChannel.$set.description = description;
			updateEmailChannel.$set.senderInfo = senderInfo;
			updateEmailChannel.$set.department = department;
			updateEmailChannel.$set.smtp = smtp;
			updateEmailChannel.$set.imap = imap;
			EmailChannel.updateById(_id, updateEmailChannel);

			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	delete() {
		if (!hasPermissionAsync(this.userId, 'manage-email-channels')) {
			throw new Error('error-not-allowed');
		}
		try {
			check(this.queryParams, {
				_id: String,
			});

			const { _id } = this.queryParams;
			const emailChannel = EmailChannel.findOneById(_id);

			if (!emailChannel) {
				return API.v1.notFound();
			}
			EmailChannel.removeById(_id);
			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
