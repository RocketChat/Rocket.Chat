import { LoginCodes } from '@rocket.chat/models';
import { isLoginCodeRedeemParamsPOST } from '@rocket.chat/rest-typings';
import { Accounts } from 'meteor/accounts-base';

import { API } from '../api';

API.v1.addRoute(
	'loginCode.redeem',
	{
		authRequired: false,
		validateParams: isLoginCodeRedeemParamsPOST,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 10 },
	},
	{
		async post() {
			const { code } = this.bodyParams;

			const loginCode = await LoginCodes.findOneNotExpiredByCode(code);

			if (!loginCode) {
				throw new Meteor.Error('error-invalid-code', 'Invalid or expired login code');
			}

			//single-use: remove code before issuing the token
			await LoginCodes.removeByCode(code);

			const { userId } = loginCode;

			const stampedToken = Accounts._generateStampedLoginToken();
			await Accounts._insertLoginToken(userId, stampedToken);

			return API.v1.success({
				loginToken: stampedToken.token,
				userId,
			});
		},
	},
);
