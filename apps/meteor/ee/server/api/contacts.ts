import { Contacts } from '@rocket.chat/models';
import { isContactsListProps, ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';

// A personal address book is not a directory: the cap is here so one request cannot pull an unbounded page.
const MAX_CONTACTS = 200;

API.v1.get(
	'contacts.list',
	{
		authRequired: true,
		query: isContactsListProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 1000 },
		response: {
			200: ajv.compile<{ contacts: IContact[]; success: true }>({
				type: 'object',
				properties: {
					contacts: { type: 'array' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['contacts', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { text } = this.queryParams;

		const contacts = await (
			text
				? Contacts.searchByUserId(userId, text, MAX_CONTACTS)
				: Contacts.findByUserId(userId, { sort: { displayName: 1 }, limit: MAX_CONTACTS })
		).toArray();

		return API.v1.success({ contacts });
	},
);
