import { EmailInbox, Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';

import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { insertOneEmailInbox, findEmailInboxes, updateEmailInbox, removeEmailInbox } from '../lib/emailInbox';

API.v1.addRoute(
	'email-inbox.list',
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'] },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();
			const emailInboxes = await findEmailInboxes({ query, pagination: { offset, count, sort } });

			return API.v1.success(emailInboxes);
		},
	},
);

API.v1.addRoute(
	'email-inbox',
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'] },
	{
		async post() {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				active: Boolean,
				name: String,
				email: String,
				description: Match.Maybe(String),
				senderInfo: Match.Maybe(String),
				department: Match.Maybe(String),
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
					maxRetries: Number,
				}),
			});

			const emailInboxParams = this.bodyParams;

			let _id: string;

			if (!emailInboxParams?._id) {
				const { insertedId } = await insertOneEmailInbox(this.userId, emailInboxParams);

				if (!insertedId) {
					return API.v1.failure('Failed to create email inbox');
				}

				_id = insertedId;
			} else {
				const emailInbox = await updateEmailInbox({ ...emailInboxParams, _id: emailInboxParams._id });

				if (!emailInbox?._id) {
					return API.v1.failure('Failed to update email inbox');
				}

				_id = emailInbox._id;
			}

			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox/:_id',
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'] },
	{
		async get() {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			const emailInbox = await EmailInbox.findOneById(_id);

			if (!emailInbox) {
				return API.v1.notFound();
			}

			return API.v1.success(emailInbox);
		},
		async delete() {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}

			const { deletedCount } = await removeEmailInbox(_id);

			if (!deletedCount) {
				return API.v1.notFound();
			}

			return API.v1.success({ _id });
		},
	},
);

API.v1.addRoute(
	'email-inbox.search',
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'] },
	{
		async get() {
			check(this.queryParams, {
				email: String,
			});

			const { email } = this.queryParams;

			// TODO: Chapter day backend - check if user has permission to view this email inbox instead of null values
			// TODO: Chapter day: Remove this endpoint and move search to GET /email-inbox
			const emailInbox = await EmailInbox.findByEmail(email);

			return API.v1.success({ emailInbox });
		},
	},
);

API.v1.addRoute(
	'email-inbox.send-test/:_id',
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'] },
	{
		async post() {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			const emailInbox = await EmailInbox.findOneById(_id);

			if (!emailInbox) {
				return API.v1.notFound();
			}

			const user = await Users.findOneById(this.userId);
			if (!user) {
				return API.v1.notFound();
			}

			await sendTestEmailToInbox(emailInbox, user);

			return API.v1.success({ _id });
		},
	},
);
