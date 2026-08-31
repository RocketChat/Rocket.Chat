import { ajv } from '../Ajv';

export type MailerUnsubscribeProps = {
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
