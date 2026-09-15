import type { IContact } from '@rocket.chat/core-typings';
import { Contacts } from '@rocket.chat/models';
import {
	isContactsCreateProps,
	isContactsListProps,
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { getPaginationItems } from '../../../server/api/lib/getPaginationItems';
import { settings } from '../../../server/settings';
import { normalizeE164 } from '../lib/exchange/sync/contacts/normalizeE164';

const SORTABLE_FIELDS = ['displayName', 'emails.address', 'categories', 'companyName', 'officeLocation'];

API.v1.get(
	'contacts.list',
	{
		authRequired: true,
		query: isContactsListProps,
		response: {
			200: ajv.compile<PaginatedResult<{ items: IContact[]; success: true }>>({
				type: 'object',
				properties: {
					items: { type: 'array' },
					count: { type: 'integer' },
					offset: { type: 'integer' },
					total: { type: 'integer' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { text, categories, companies } = this.queryParams;

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		if (sort && !Object.keys(sort).every((key) => SORTABLE_FIELDS.includes(key))) {
			return API.v1.failure('error-invalid-sort-keys');
		}

		const { cursor, totalCount } = Contacts.findPaginatedByUserId(
			userId,
			{ text, ...(categories && { categories }), ...(companies && { companies }) },
			{ sort: sort ?? { displayName: 1 }, skip: offset, limit: count },
		);

		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({ items, count: items.length, offset, total });
	},
);

API.v1.post(
	'contacts.create',
	{
		authRequired: true,
		body: isContactsCreateProps,
		response: {
			200: ajv.compile<{ id: IContact['_id']; success: true }>({
				type: 'object',
				properties: {
					id: { type: 'string' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['id', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { displayName, givenName, surname, companyName, emails, phones } = this.bodyParams;

		// Same region policy as ingestion, or a locally created number would never match an incoming call.
		const defaultRegion = settings.get<string>('Exchange_Contacts_Default_Region') ?? '';

		const id = await Contacts.createManual({
			uid: userId,
			displayName,
			...(givenName && { givenName }),
			...(surname && { surname }),
			...(companyName && { companyName }),
			emails: emails ?? [],
			phones: (phones ?? []).map(({ raw, label }) => {
				const e164 = normalizeE164(raw, defaultRegion);
				return { raw, ...(e164 && { e164 }), ...(label && { label }) };
			}),
		});

		return API.v1.success({ id });
	},
);

API.v1.get(
	'contacts.filters',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ categories: string[]; companies: string[]; success: true }>({
				type: 'object',
				properties: {
					categories: { type: 'array', items: { type: 'string' } },
					companies: { type: 'array', items: { type: 'string' } },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['categories', 'companies', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { categories, companies } = await Contacts.findFilterOptionsByUserId(this.userId);

		return API.v1.success({ categories, companies });
	},
);
