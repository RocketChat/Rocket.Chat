import { ajv } from '@rocket.chat/rest-typings';

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
