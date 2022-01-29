import { check, Match } from 'meteor/check';

import { API } from '../api';
import { findEmailInboxes, findOneEmailInbox, insertOneOrUpdateEmailInbox } from '../lib/emailInbox';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';
import { EmailInbox } from '../../../models/server/raw';
import Users from '../../../models/server/models/Users';
import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';

API.v1.addRoute(
	'email-inbox.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailInboxes = Promise.await(findEmailInboxes({ userId: this.userId, query, pagination: { offset, count, sort } }));

			return API.v1.success(emailInboxes);
		},
	},
);

API.v1.addRoute(
	'email-inbox',
	{ authRequired: true },
	{
		post() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				name: String,
				email: String,
				active: Boolean,
				description: Match.Maybe(String),
				senderInfo: Match.Maybe(String),
				department: Match.Maybe(String),
				smtp: Match.ObjectIncluding({
					password: String,
					port: Number,
					secure: Boolean,
					server: String,
					username: String,
				}),
				imap: Match.ObjectIncluding({
					password: String,
					port: Number,
					secure: Boolean,
					server: String,
					username: String,
				}),
			});

			const emailInboxParams = this.bodyParams;

			const { _id } = emailInboxParams;

			Promise.await(insertOneOrUpdateEmailInbox(this.userId, emailInboxParams));

			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox/:_id',
	{ authRequired: true },
	{
		get() {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			const emailInboxes = Promise.await(findOneEmailInbox({ userId: this.userId, _id }));

			return API.v1.success(emailInboxes);
		},
		delete() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}

			const emailInboxes = Promise.await(EmailInbox.findOneById(_id));

			if (!emailInboxes) {
				return API.v1.notFound();
			}
			Promise.await(EmailInbox.removeById(_id));
			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox.search',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.queryParams, {
				email: String,
			});

			const { email } = this.queryParams;
			const emailInbox = Promise.await(EmailInbox.findOne({ email }));

			return API.v1.success({ emailInbox });
		},
	},
);

API.v1.addRoute(
	'email-inbox.send-test/:_id',
	{ authRequired: true },
	{
		post() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			const emailInbox = Promise.await(findOneEmailInbox({ userId: this.userId, _id }));

			if (!emailInbox) {
				return API.v1.notFound();
			}

			const user = Users.findOneById(this.userId);

			Promise.await(sendTestEmailToInbox(emailInbox, user));

			return API.v1.success({ _id });
		},
	},
);
