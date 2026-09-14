import type { IContact } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajvQuery } from './Ajv';

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

export type ContactsEndpoints = {
	'/v1/contacts.list': {
		GET: (params: ContactsListProps) => { contacts: IContact[] };
	};
};
