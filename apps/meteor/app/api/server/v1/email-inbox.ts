import { EmailInbox, Users } from '@rocket.chat/models';
import { isEmailInbox, isEmailInboxSearch } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { insertOneEmailInbox, findEmailInboxes, findOneEmailInbox, updateEmailInbox } from '../lib/emailInbox';

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
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'], validateParams: isEmailInbox },
	{
		async post() {
			const emailInboxParams = this.bodyParams;

			let _id: string;

			if (!emailInboxParams?._id) {
				const emailInbox = await insertOneEmailInbox(this.userId, emailInboxParams);
				_id = emailInbox.insertedId.toString();
			} else {
				_id = emailInboxParams._id;
				await updateEmailInbox({ ...emailInboxParams, _id });
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
			const { _id } = this.urlParams;
			if (!_id) {
				throw new Error('error-invalid-param');
			}
			const emailInbox = await findOneEmailInbox({ _id });

			if (!emailInbox) {
				return API.v1.notFound();
			}

			return API.v1.success(emailInbox);
		},
		async delete() {
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
	{ authRequired: true, permissionsRequired: ['manage-email-inbox'], validateParams: isEmailInboxSearch },
	{
		async get() {
			const { email } = this.queryParams;

			// TODO: Chapter day backend - check if user has permission to view this email inbox instead of null values
			// TODO: Chapter day: Remove this endpoint and move search to GET /email-inbox
			const emailInbox = await EmailInbox.findOne({ email });

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
			const emailInbox = await findOneEmailInbox({ _id });

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
