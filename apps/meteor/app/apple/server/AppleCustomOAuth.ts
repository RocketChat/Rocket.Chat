import { Accounts } from 'meteor/accounts-base';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { MeteorError } from '../../../server/sdk/errors';
import { handleIdentityToken } from '../lib/handleIdentityToken';

export class AppleCustomOAuth extends CustomOAuth {
	getIdentity(_accessToken: string, query: Record<string, any>): any {
		const { id_token: identityToken, user: userStr = '' } = query;

		let usrObj = {} as any;
		try {
			usrObj = JSON.parse(userStr);
		} catch (e) {
			// ignore
		}

		try {
			const serviceData = handleIdentityToken(identityToken);

			if (usrObj?.name) {
				serviceData.name = `${usrObj.name.firstName}${usrObj.name.middleName ? ` ${usrObj.name.middleName}` : ''}${
					usrObj.name.lastName ? ` ${usrObj.name.lastName}` : ''
				}`;
			}

			return serviceData;
		} catch (error: any) {
			return {
				type: 'apple',
				error: new MeteorError(Accounts.LoginCancelledError.numericError, error.message),
			};
		}
	}
}
