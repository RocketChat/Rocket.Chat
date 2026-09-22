import type { IContact } from '@rocket.chat/core-typings';
import { Contacts } from '@rocket.chat/models';
import {
	isContactsCreateProps,
	isContactsDeleteProps,
	isContactsListProps,
	isContactsUpdateProps,
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { LocalContactPayload, PaginatedResult } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { getPaginationItems } from '../../../server/api/lib/getPaginationItems';
import { settings } from '../../../server/settings';
import { normalizeE164 } from '../lib/exchange/sync/contacts/normalizeE164';

const SORTABLE_FIELDS = ['displayName', 'emails.address', 'phones.raw', 'categories', 'companyName', 'officeLocation'];

const toLocalContact = ({ displayName, givenName, surname, companyName, emails, phones }: LocalContactPayload) => {
	const defaultRegion = settings.get<string>('Exchange_Contacts_Default_Region') ?? '';

	return {
		displayName: displayName || [givenName, surname].filter(Boolean).join(' '),
		givenName,
		...(surname && { surname }),
		...(companyName && { companyName }),
		emails: emails ?? [],
		phones: (phones ?? []).map(({ raw }) => {
			const e164 = normalizeE164(raw, defaultRegion);
			return { raw, ...(e164 && { e164 }) };
		}),
	};
};

API.v1.get(
	'contacts.list',
	{
		authRequired: true,
		query: isContactsListProps,
		response: {
			200: ajv.compile<PaginatedResult<{ items: IContact[]; syncedTotal: number; success: true }>>({
				type: 'object',
				properties: {
					items: { type: 'array' },
					count: { type: 'integer' },
					offset: { type: 'integer' },
					total: { type: 'integer' },
					syncedTotal: { type: 'integer' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'count', 'offset', 'total', 'syncedTotal', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { text } = this.queryParams;

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		if (sort && !Object.keys(sort).every((key) => SORTABLE_FIELDS.includes(key))) {
			return API.v1.failure('error-invalid-sort-keys');
		}

		const { cursor, totalCount } = Contacts.findPaginatedByUserId(userId, text, {
			sort: sort ?? { displayName: 1 },
			skip: offset,
			limit: count,
		});

		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		const syncedTotal = await Contacts.countImportedByUserId(userId);

		return API.v1.success({ items, count: items.length, offset, total, syncedTotal });
	},
);

API.v1.post(
	'contacts.create',
	{
		authRequired: true,
		body: isContactsCreateProps,
		response: {
			200: ajv.compile<{ contact: IContact; success: true }>({
				type: 'object',
				properties: {
					contact: { type: 'object' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['contact', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;

		const contact = await Contacts.createLocal({
			uid: userId,
			...toLocalContact(this.bodyParams),
		});

		if (!contact) {
			return API.v1.failure('error-contact-not-created');
		}

		return API.v1.success({ contact });
	},
);

API.v1.post(
	'contacts.update',
	{
		authRequired: true,
		body: isContactsUpdateProps,
		response: {
			200: ajv.compile<{ success: true }>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { contactId, ...payload } = this.bodyParams;

		const { matchedCount } = await Contacts.updateLocal(this.userId, contactId, toLocalContact(payload));

		if (!matchedCount) {
			return API.v1.notFound();
		}

		return API.v1.success({});
	},
);

API.v1.post(
	'contacts.delete',
	{
		authRequired: true,
		body: isContactsDeleteProps,
		response: {
			200: ajv.compile<{ success: true }>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { deletedCount } = await Contacts.deleteLocal(this.userId, this.bodyParams.contactId);

		if (!deletedCount) {
			return API.v1.notFound();
		}

		return API.v1.success({});
	},
);
