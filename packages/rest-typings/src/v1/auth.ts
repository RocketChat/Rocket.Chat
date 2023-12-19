import Ajv from 'ajv';

type LoginWithPassword<T extends object> = (T & { password: string }) | (T & { password: { hashed: string } });

type EmailLogin = LoginWithPassword<{ email: string }>;
type UsernameLogin = LoginWithPassword<{ username: string }>;
type UserLogin = LoginWithPassword<{ user: { username: string } | { email: string } | string }>;

export type LoginProps = (EmailLogin | UsernameLogin | UserLogin) & { code?: string };

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
		password: { oneOf: [{ type: 'string' }, { type: 'object' }], nullable: true },
		email: { type: 'string', nullable: true },
		code: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
};

export const isLoginProps = ajv.compile(loginPropsSchema);
