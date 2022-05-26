import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type SessionsProps = {
	sessionId: string;
};

export const isSessionsProps = ajv.compile<SessionsProps>({
	type: 'object',
	properties: {
		sessionId: {
			type: 'string',
		},
	},
	required: ['sessionId'],
	additionalProperties: false,
});
