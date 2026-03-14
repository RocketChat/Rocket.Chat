import type { IEmailInbox } from '@rocket.chat/core-typings';
import { EmailInbox, Users } from '@rocket.chat/models';
import {
	ajv,
	isEmailInboxList,
	isEmailInbox,
	isEmailInboxSearch,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findEmailInboxes, insertOneEmailInbox, removeEmailInbox, updateEmailInbox } from '../lib/emailInbox';

const paginatedEmailInboxesResponseSchema = ajv.compile<{ emailInboxes: IEmailInbox[]; total: number; count: number; offset: number }>({
	type: 'object',
	properties: {
		emailInboxes: { type: 'array', items: { $ref: '#/components/schemas/IEmailInbox' } },
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['emailInboxes', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'email-inbox.list',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		query: isEmailInboxList,
		response: {
			200: paginatedEmailInboxesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, query } = await this.parseJsonQuery();
		const emailInboxes = await findEmailInboxes({ query, pagination: { offset, count, sort } });

		return API.v1.success(emailInboxes);
	},
);

API.v1.post(
	'email-inbox',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		body: isEmailInbox,
		response: {
			200: ajv.compile<{ _id: string }>({
				type: 'object',
				properties: { _id: { type: 'string' }, success: { type: 'boolean', enum: [true] } },
				required: ['_id', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [false] }, error: { type: 'string' } },
				required: ['success', 'error'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const body = this.bodyParams;
		const maxRetries =
			'maxRetries' in body.imap && typeof (body.imap as { maxRetries?: number }).maxRetries === 'number'
				? (body.imap as { maxRetries: number }).maxRetries
				: 5;
		const emailInboxParams = {
			...body,
			imap: {
				...body.imap,
				maxRetries,
			},
		};

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
);

API.v1.get(
	'email-inbox/:_id',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		response: {
			200: ajv.compile<IEmailInbox | null>({
				oneOf: [
					{
						allOf: [
							{ $ref: '#/components/schemas/IEmailInbox' },
							{
								type: 'object',
								properties: {
									success: { type: 'boolean', enum: [true] },
								},
								required: ['success'],
							},
						],
					},
					{ type: 'null' },
				],
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.delete(
	'email-inbox/:_id',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		response: {
			200: ajv.compile<{ _id: string }>({
				type: 'object',
				properties: { _id: { type: 'string' }, success: { type: 'boolean', enum: [true] } },
				required: ['_id', 'success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'email-inbox.search',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		query: isEmailInboxSearch,
		response: {
			200: ajv.compile<{ emailInbox: IEmailInbox | null }>({
				type: 'object',
				properties: {
					emailInbox: { oneOf: [{ $ref: '#/components/schemas/IEmailInbox' }, { type: 'null' }] },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['emailInbox', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { email } = this.queryParams;

		const emailInbox = await EmailInbox.findByEmail(email);

		return API.v1.success({ emailInbox });
	},
);

API.v1.post(
	'email-inbox.send-test/:_id',
	{
		authRequired: true,
		permissionsRequired: ['manage-email-inbox'],
		response: {
			200: ajv.compile<{ _id: string }>({
				type: 'object',
				properties: { _id: { type: 'string' }, success: { type: 'boolean', enum: [true] } },
				required: ['_id', 'success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
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
);
