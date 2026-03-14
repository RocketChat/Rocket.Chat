import type { IEmailInbox } from '@rocket.chat/core-typings';
import { EmailInbox, Users } from '@rocket.chat/models';
import {
	ajv,
	isEmailInboxList,
	isEmailInbox,
	isEmailInboxSearch,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';

import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { insertOneEmailInbox, findEmailInboxes, updateEmailInbox, removeEmailInbox } from '../lib/emailInbox';

const emailInboxEndpoints = API.v1
	.get(
		'email-inbox.list',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			query: isEmailInboxList,
			response: {
				200: ajv.compile<{ emailInboxes: IEmailInbox[]; count: number; offset: number; total: number; success: true }>({
					type: 'object',
					properties: {
						emailInboxes: { type: 'array', items: { type: 'object', additionalProperties: true } },
						count: { type: 'number' },
						offset: { type: 'number' },
						total: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['emailInboxes', 'count', 'offset', 'total', 'success'],
					additionalProperties: false,
				}),
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
	)
	.post(
		'email-inbox',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			body: isEmailInbox,
			response: {
				200: ajv.compile<{ _id: string; success: true }>({
					type: 'object',
					properties: {
						_id: { type: 'string' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['_id', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
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
	)
	.get(
		'email-inbox/:_id',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			response: {
				200: ajv.compile<IEmailInbox & { success: true }>({
					type: 'object',
					additionalProperties: true,
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
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
	)
	.delete(
		'email-inbox/:_id',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			response: {
				200: ajv.compile<{ _id: string; success: true }>({
					type: 'object',
					properties: {
						_id: { type: 'string' },
						success: { type: 'boolean', enum: [true] },
					},
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
	)
	.get(
		'email-inbox.search',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			query: isEmailInboxSearch,
			response: {
				200: ajv.compile<{ emailInbox: IEmailInbox | null; success: true }>({
					type: 'object',
					properties: {
						emailInbox: { type: 'object', additionalProperties: true, nullable: true },
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

			// TODO: Chapter day backend - check if user has permission to view this email inbox instead of null values
			// TODO: Chapter day: Remove this endpoint and move search to GET /email-inbox
			const emailInbox = await EmailInbox.findByEmail(email);

			return API.v1.success({ emailInbox });
		},
	)
	.post(
		'email-inbox.send-test/:_id',
		{
			authRequired: true,
			permissionsRequired: ['manage-email-inbox'],
			response: {
				200: ajv.compile<{ _id: string; success: true }>({
					type: 'object',
					properties: {
						_id: { type: 'string' },
						success: { type: 'boolean', enum: [true] },
					},
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

export type EmailInboxApiEndpoints = ExtractRoutesFromAPI<typeof emailInboxEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends EmailInboxApiEndpoints {}
}
