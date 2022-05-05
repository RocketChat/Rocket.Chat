import { check, Match } from 'meteor/check';

import { API } from '../api';
import { insertOneEmailInbox, findEmailInboxes, findOneEmailInbox, updateEmailInbox } from '../lib/emailInbox';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';
import { EmailInbox } from '../../../models/server/raw';
import Users from '../../../models/server/models/Users';
import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';

API.v1.addRoute(
	'email-inbox.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailInboxes = await findEmailInboxes({ userId: this.userId, query, pagination: { offset, count, sort } });

			return API.v1.success(emailInboxes);
		},
	},
);

API.v1.addRoute(
	'email-inbox',
	{ authRequired: true },
	{
		async post() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				active: Boolean,
				name: String,
				email: String,
				description: String,
				senderInfo: String,
				department: String,
				smtp: Match.ObjectIncluding({
					server: String,
					port: Number,
					username: String,
					password: String,
					secure: Boolean,
				}),
				imap: Match.ObjectIncluding({
					server: String,
					port: Number,
					username: String,
					password: String,
					secure: Boolean,
				}),
			});

			const emailInboxParams = this.bodyParams;

			let _id: string;

			if (!emailInboxParams?._id) {
				const emailInbox = await insertOneEmailInbox(this.userId, emailInboxParams);
				_id = emailInbox.insertedId.toString();
			} else {
				_id = emailInboxParams._id;
				await updateEmailInbox(this.userId, { ...emailInboxParams, _id });
			}
			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox/:_id',
	{ authRequired: true },
	{
		async get() {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			// TODO: Chapter day backend - check if user has permission to view this email inbox instead of null values
			const emailInboxes = await findOneEmailInbox({ userId: this.userId, _id });

			return API.v1.success(emailInboxes);
		},
		async delete() {
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

			const emailInboxes = await EmailInbox.findOneById(_id);

			if (!emailInboxes) {
				return API.v1.notFound();
			}
			await EmailInbox.removeById(_id);
			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox.search',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.queryParams, {
				email: String,
			});

			const { email } = this.queryParams;

			// TODO: Chapter day backend - check if user has permission to view this email inbox instead of null values
			const emailInbox = await EmailInbox.findOne({ email });

			return API.v1.success({ emailInbox });
		},
	},
);

API.v1.addRoute(
	'email-inbox.send-test/:_id',
	{ authRequired: true },
	{
		async post() {
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
			const emailInbox = await findOneEmailInbox({ userId: this.userId, _id });

			if (!emailInbox) {
				return API.v1.notFound();
			}

			const user = Users.findOneById(this.userId);

			await sendTestEmailToInbox(emailInbox, user);

			return API.v1.success({ _id });
		},
	},
);
