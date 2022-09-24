import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type MailerProps = {
	from: string;
	subject: string;
	body: string;
	dryrun?: boolean;
	query?: string;
};

const MailerPropsSchema = {
	type: 'object',
	properties: {
		from: {
			type: 'string',
		},
		subject: {
			type: 'string',
		},
		body: {
			type: 'string',
		},
		dryrun: {
			type: 'boolean',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['from', 'subject', 'body'],
	additionalProperties: false,
};

export const isMailerProps = ajv.compile<MailerProps>(MailerPropsSchema);

type MailerUnsubscribeProps = {
	_id: string;
	createdAt: string;
};

const MailerUnsubscribePropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		createdAt: {
			type: 'string',
		},
	},
	required: ['_id', 'createdAt'],
	additionalProperties: false,
};

export const isMailerUnsubscribeProps = ajv.compile<MailerUnsubscribeProps>(MailerUnsubscribePropsSchema);

export type MailerEndpoints = {
	'/v1/mailer': {
		POST: (params: MailerProps) => void;
	};

	'/v1/mailer.unsubscribe': {
		POST: (params: MailerUnsubscribeProps) => void;
	};
};
