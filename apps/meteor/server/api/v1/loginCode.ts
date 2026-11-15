import { LoginCodes } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';
import type { JSONSchemaType } from 'ajv';
import { Accounts } from 'meteor/accounts-base';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const loginCodeRedeemResponse = ajv.compile<{ loginToken: string; userId: string }>({
	type: 'object',
	properties: {
		loginToken: { type: 'string' },
		userId: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['loginToken', 'userId', 'success'],
	additionalProperties: false,
});

type LoginCodeRedeemParams = { code: string };

const LoginCodeRedeemSchema: JSONSchemaType<LoginCodeRedeemParams> = {
	type: 'object',
	properties: {
		code: { type: 'string', minLength: 64, maxLength: 64 },
	},
	required: ['code'],
	additionalProperties: false,
};

const isLoginCodeRedeemParamsPOST = ajv.compile<LoginCodeRedeemParams>(LoginCodeRedeemSchema);

const loginCodeEndpoints = API.v1.post(
	'loginCode.redeem',
	{
		authRequired: false,
		body: isLoginCodeRedeemParamsPOST,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 10 },
		response: {
			200: loginCodeRedeemResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { code } = this.bodyParams;

		const loginCode = await LoginCodes.findOneNotExpiredByCodeAndDelete(code);

		if (!loginCode) {
			return API.v1.failure('error-invalid-code');
		}

		const { userId } = loginCode;

		const stampedToken = Accounts._generateStampedLoginToken();
		await Accounts._insertLoginToken(userId, stampedToken);

		return API.v1.success({
			loginToken: stampedToken.token,
			userId,
		});
	},
);

type LoginCodeEndpoints = ExtractRoutesFromAPI<typeof loginCodeEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LoginCodeEndpoints {}
}
