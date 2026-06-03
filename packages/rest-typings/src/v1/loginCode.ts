import { ajv } from './Ajv';

type LoginCodeRedeemParams = { code: string };

const LoginCodeRedeemSchema = {
	type: 'object',
	properties: {
		code: { type: 'string' },
	},
	required: ['code'],
	additionalProperties: false,
};

export const isLoginCodeRedeemParamsPOST = ajv.compile<LoginCodeRedeemParams>(LoginCodeRedeemSchema);

export type LoginCodeEndpoints = {
	'/v1/loginCode.redeem': {
		POST: (params: LoginCodeRedeemParams) => { loginToken: string; userId: string };
	};
};
