import type { IContact } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type ContactsSortableField = 'displayName' | 'emails.address' | 'categories' | 'companyName' | 'officeLocation';

export type ContactsListProps = PaginatedRequest<{ text?: string }, ContactsSortableField>;

const ContactsListPropsSchema = {
	type: 'object',
	properties: {
		text: { type: 'string', nullable: true },
		count: { type: 'integer', nullable: true },
		offset: { type: 'integer', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

export const isContactsListProps = ajvQuery.compile<ContactsListProps>(ContactsListPropsSchema);

export type LocalContactPayload = {
	displayName?: string;
	givenName: string;
	surname?: string;
	companyName?: string;
	emails?: { address: string }[];
	phones?: { raw: string }[];
};

const localContactProperties = {
	displayName: {
		type: 'string',
		minLength: 1,
		nullable: true,
	},
	givenName: {
		type: 'string',
		minLength: 1,
		nullable: false,
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
			},
			required: ['raw'],
			additionalProperties: false,
		},
		nullable: true,
	},
} as const;

export type ContactsCreateProps = LocalContactPayload;

const contactsCreatePropsSchema: JSONSchemaType<ContactsCreateProps> = {
	type: 'object',
	properties: localContactProperties,
	required: ['givenName'],
	additionalProperties: false,
};

export const isContactsCreateProps = ajv.compile(contactsCreatePropsSchema);

export type ContactsUpdateProps = LocalContactPayload & { contactId: string };

const contactsUpdatePropsSchema: JSONSchemaType<ContactsUpdateProps> = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
			minLength: 1,
		},
		...localContactProperties,
	},
	required: ['contactId', 'givenName'],
	additionalProperties: false,
};

export const isContactsUpdateProps = ajv.compile(contactsUpdatePropsSchema);

export type ContactsDeleteProps = { contactId: string };

const contactsDeletePropsSchema: JSONSchemaType<ContactsDeleteProps> = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isContactsDeleteProps = ajv.compile(contactsDeletePropsSchema);

export type ContactsEndpoints = {
	'/v1/contacts.list': {
		GET: (params: ContactsListProps) => PaginatedResult<{ items: IContact[]; syncedTotal: number }>;
	};
	'/v1/contacts.create': {
		POST: (params: ContactsCreateProps) => { id: IContact['_id'] };
	};
	'/v1/contacts.update': {
		POST: (params: ContactsUpdateProps) => void;
	};
	'/v1/contacts.delete': {
		POST: (params: ContactsDeleteProps) => void;
	};
};
