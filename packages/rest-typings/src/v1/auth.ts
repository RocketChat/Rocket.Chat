import Ajv from 'ajv';

type Password = string | { hashed: string };

type EmailLogin = { email: string };
type UsernameLogin = { username: string };
type UserLogin = { user: UsernameLogin | EmailLogin | string };

export type LoginProps = (EmailLogin | UsernameLogin | UserLogin) & { code?: string; password?: Password };

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

const ajv = new Ajv();

const loginPropsSchema = {
	type: 'object',
	properties: {
		user: { type: 'object', nullable: true },
		username: { type: 'string', nullable: true },
		password: { oneOf: [{ type: 'string',  nullable: true }, { type: 'object', nullable: true }]},
		email: { type: 'string', nullable: true },
		code: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

export const isLoginProps = ajv.compile(loginPropsSchema);
