import type { IContact } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv, ajvQuery } from './Ajv';

type ContactsListProps = { text?: string };

const ContactsListPropsSchema: JSONSchemaType<ContactsListProps> = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isContactsListProps = ajvQuery.compile(ContactsListPropsSchema);

const ContactsListSuccessResponseSchema = {
	type: 'object',
	properties: {
		contacts: { type: 'array' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['contacts', 'success'],
	additionalProperties: false,
};

export const validateContactsListSuccessResponse = ajv.compile<{ contacts: IContact[]; success: true }>(ContactsListSuccessResponseSchema);

export type ContactsEndpoints = {
	'/v1/contacts.list': {
		GET: (params: ContactsListProps) => { contacts: IContact[] };
	};
};
