import type { IEmailInbox } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type EmailInboxListProps = PaginatedRequest<{ query?: string }>;

const EmailInboxListPropsSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isEmailInboxList = ajv.compile<EmailInboxListProps>(EmailInboxListPropsSchema);

type EmailInboxProps = {
	_id?: string;
	name: string;
	email: string;
	active: boolean; // POST method
	description?: string;
	senderInfo?: string;
	department?: string;
	smtp: {
		password: string;
		port: number;
		secure: boolean;
		server: string;
		username: string;
	};
	imap: {
		password: string;
		port: number;
		secure: boolean;
		server: string;
		username: string;
	};
};

const EmailInboxPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
		},
		email: {
			type: 'string',
		},
		active: {
			type: 'boolean',
		},
		description: {
			type: 'string',
		},
		senderInfo: {
			type: 'string',
		},
		department: {
			type: 'string',
		},

		smtp: {
			type: 'object',
			properties: {
				password: {
					type: 'string',
				},
				port: {
					type: 'number',
				},
				secure: {
					type: 'boolean',
				},
				server: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
			},
			required: ['password', 'port', 'secure', 'server', 'username'],
			additionalProperties: false,
		},

		imap: {
			type: 'object',
			properties: {
				password: {
					type: 'string',
				},
				port: {
					type: 'number',
				},
				secure: {
					type: 'boolean',
				},
				server: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
			},
			required: ['password', 'port', 'secure', 'server', 'username'],
			additionalProperties: false,
		},
	},

	required: ['name', 'email', 'active', 'description', 'senderInfo', 'department', 'smtp', 'imap'],
	additionalProperties: false,
};

export const isEmailInbox = ajv.compile<EmailInboxProps>(EmailInboxPropsSchema);

type EmailInboxSearchProps = {
	email: string;
};

const EmailInboxSearchPropsSchema = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
		},
	},
	required: ['email'],
	additionalProperties: false,
};

export const isEmailInboxSearch = ajv.compile<EmailInboxSearchProps>(EmailInboxSearchPropsSchema);

export type EmailInboxEndpoints = {
	'/v1/email-inbox.list': {
		GET: (params: EmailInboxListProps) => PaginatedResult<{ emailInboxes: IEmailInbox[] }>;
	};

	'/v1/email-inbox': {
		POST: (params: EmailInboxProps) => { _id: string };
	};

	'/v1/email-inbox/:_id': {
		GET: () => IEmailInbox | null;
		DELETE: () => { _id: string };
	};

	'/v1/email-inbox.search': {
		GET: (params: EmailInboxSearchProps) => { emailInbox: IEmailInbox | null };
	};

	'/v1/email-inbox.send-test/:_id': {
		POST: () => { _id: string };
	};
};
