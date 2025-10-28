import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type MailerProps = {
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
