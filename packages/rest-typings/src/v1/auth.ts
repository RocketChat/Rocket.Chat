import { ajv } from '../helpers/schemas';

export type LoginProps = { user: Record<string, any> | string; username: string; email: string; password: string; code: string };

type LogoutResponse = {
	message: string;
};

export type AuthEndpoints = {
	'/v1/login': {
		POST: (params: LoginProps) => Record<string, any>;
	};

	'/v1/logout': {
		POST: () => LogoutResponse;
		GET: () => LogoutResponse;
	};
};

const loginPropsSchema = {
	type: 'object',
	properties: {
		user: { type: 'object', nullable: true },
		username: { type: 'string', nullable: true },
		password: { type: 'string', nullable: true },
		email: { type: 'string', nullable: true },
		code: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

export const isLoginProps = ajv.compile(loginPropsSchema);
