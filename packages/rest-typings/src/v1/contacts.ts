import type { IContact } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type ContactsSortableField = 'displayName' | 'emails.address' | 'categories' | 'companyName' | 'officeLocation';

export type ContactsListProps = PaginatedRequest<
	{
		text?: string;
		categories?: string[];
		companies?: string[];
	},
	ContactsSortableField
>;

const ContactsListPropsSchema = {
	type: 'object',
	properties: {
		text: { type: 'string', nullable: true },
		categories: { type: 'array', nullable: true, items: { type: 'string' }, maxItems: 50 },
		companies: { type: 'array', nullable: true, items: { type: 'string' }, maxItems: 50 },
		count: { type: 'integer', nullable: true },
		offset: { type: 'integer', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

export const isContactsListProps = ajvQuery.compile<ContactsListProps>(ContactsListPropsSchema);

export type ContactsCreateProps = {
	displayName: string;
	givenName?: string;
	surname?: string;
	companyName?: string;
	emails?: { address: string }[];
	phones?: { raw: string; label?: string }[];
};

const contactsCreatePropsSchema: JSONSchemaType<ContactsCreateProps> = {
	type: 'object',
	properties: {
		displayName: {
			type: 'string',
			minLength: 1,
			nullable: false,
		},
		givenName: {
			type: 'string',
			nullable: true,
		},
		surname: {
			type: 'string',
			nullable: true,
		},
		companyName: {
			type: 'string',
			nullable: true,
		},
		emails: {
			type: 'array',
			maxItems: 10,
			items: {
				type: 'object',
				properties: {
					address: { type: 'string', minLength: 1 },
				},
				required: ['address'],
				additionalProperties: false,
			},
			nullable: true,
		},
		phones: {
			type: 'array',
			maxItems: 10,
			items: {
				type: 'object',
				properties: {
					raw: { type: 'string', minLength: 1 },
					label: { type: 'string', nullable: true },
				},
				required: ['raw'],
				additionalProperties: false,
			},
			nullable: true,
		},
	},
	required: ['displayName'],
	additionalProperties: false,
};

export const isContactsCreateProps = ajv.compile(contactsCreatePropsSchema);

export type ContactsEndpoints = {
	'/v1/contacts.list': {
		GET: (params: ContactsListProps) => PaginatedResult<{ items: IContact[] }>;
	};
	'/v1/contacts.filters': {
		GET: () => { categories: string[]; companies: string[] };
	};
	'/v1/contacts.create': {
		POST: (params: ContactsCreateProps) => { id: IContact['_id'] };
	};
};
