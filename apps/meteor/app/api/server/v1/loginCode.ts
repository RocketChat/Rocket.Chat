import { LoginCodes } from '@rocket.chat/models';
import {
	ajv,
	isLoginCodeRedeemParamsPOST,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { Accounts } from 'meteor/accounts-base';

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

API.v1.post(
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
			throw new Meteor.Error('error-invalid-code', 'Invalid or expired login code');
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
