import type { IContactPublic } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
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

	const name = givenName.trim();
	const lastName = surname?.trim();
	const company = companyName?.trim();

	return {
		displayName: displayName?.trim() || [name, lastName].filter(Boolean).join(' '),
		givenName: name,
		...(lastName && { surname: lastName }),
		...(company && { companyName: company }),
		emails: (emails ?? []).flatMap(({ address, label }) => {
			const value = address.trim();
			const tag = label?.trim();

			return value ? [{ address: value, ...(tag && { label: tag }) }] : [];
		}),
		phones: (phones ?? []).flatMap(({ raw, label }) => {
			const value = raw.trim();
			const tag = label?.trim();

			if (!value) {
				return [];
			}

			const e164 = normalizeE164(value, defaultRegion);

			return [{ raw: value, ...(e164 && { e164 }), ...(tag && { label: tag }) }];
		}),
	};
};

API.v1.get(
	'contacts.list',
	{
		authRequired: true,
		query: isContactsListProps,
		response: {
			200: ajv.compile<PaginatedResult<{ items: IContactPublic[]; syncedTotal: number; success: true }>>({
				type: 'object',
				properties: {
					items: { type: 'array', items: { $ref: '#/components/schemas/IContactPublic' } },
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

		const licensed = License.hasModule('outlook-calendar');

		const { cursor, totalCount } = Contacts.findPaginatedByUserId(
			userId,
			text,
			{
				sort: sort ?? { displayName: 1 },
				skip: offset,
				limit: count,
				projection: { uid: 0, externalId: 0, folderId: 0, lastSyncAt: 0 },
			},
			licensed ? undefined : 'local',
		);

		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		const syncedTotal = licensed ? await Contacts.countImportedByUserId(userId) : 0;

		return API.v1.success({ items, count: items.length, offset, total, syncedTotal });
	},
);

API.v1.post(
	'contacts.create',
	{
		authRequired: true,
		body: isContactsCreateProps,
		response: {
			200: ajv.compile<{ contact: IContactPublic; success: true }>({
				type: 'object',
				properties: {
					contact: { $ref: '#/components/schemas/IContactPublic' },
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
