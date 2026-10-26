import type { IContactPublic } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export const CONTACTS_SORTABLE_FIELDS = [
	'displayName',
	'emails.address',
	'phones.raw',
	'categories',
	'companyName',
	'officeLocation',
] as const;

export type ContactsSortableField = (typeof CONTACTS_SORTABLE_FIELDS)[number];

export type ContactsListProps = PaginatedRequest<{ text?: string; favorite?: boolean }, ContactsSortableField>;

const ContactsListPropsSchema = {
	type: 'object',
	properties: {
		text: { type: 'string', nullable: true },
		favorite: { type: 'boolean', nullable: true },
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
	givenName: string;
	surname?: string;
	companyName?: string;
	emails?: { address: string; label?: string }[];
	phones?: { raw: string; label?: string }[];
};

const localContactProperties = {
	givenName: {
		type: 'string',
		minLength: 1,
		pattern: '\\S',
		nullable: false,
	},
	surname: {
		type: 'string',
		minLength: 1,
		nullable: true,
	},
	companyName: {
		type: 'string',
		minLength: 1,
		nullable: true,
	},
	emails: {
		type: 'array',
		maxItems: 10,
		items: {
			type: 'object',
			properties: {
				address: { type: 'string', minLength: 1 },
				label: { type: 'string', nullable: true },
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

export type ContactsInfoProps = { contactId: string };

const contactsInfoPropsSchema: JSONSchemaType<ContactsInfoProps> = {
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

export const isContactsInfoProps = ajvQuery.compile(contactsInfoPropsSchema);

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

export type ContactsFavoriteProps = { contactId: string; favorite: boolean };

const contactsFavoritePropsSchema: JSONSchemaType<ContactsFavoriteProps> = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
			minLength: 1,
		},
		favorite: {
			type: 'boolean',
		},
	},
	required: ['contactId', 'favorite'],
	additionalProperties: false,
};

export const isContactsFavoriteProps = ajv.compile(contactsFavoritePropsSchema);

export type ContactsEndpoints = {
	'/v1/contacts.list': {
		GET: (params: ContactsListProps) => PaginatedResult<{ items: IContactPublic[]; syncedTotal: number }>;
	};
	'/v1/contacts.info': {
		GET: (params: ContactsInfoProps) => { contact: IContactPublic };
	};
	'/v1/contacts.create': {
		POST: (params: ContactsCreateProps) => { contact: IContactPublic };
	};
	'/v1/contacts.update': {
		POST: (params: ContactsUpdateProps) => { contact: IContactPublic };
	};
	'/v1/contacts.delete': {
		POST: (params: ContactsDeleteProps) => void;
	};
	'/v1/contacts.favorite': {
		POST: (params: ContactsFavoriteProps) => void;
	};
};
