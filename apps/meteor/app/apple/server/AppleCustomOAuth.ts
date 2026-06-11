import { MeteorError } from '@rocket.chat/core-services';
import { Accounts } from 'meteor/accounts-base';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';
import { handleIdentityToken } from '../lib/handleIdentityToken';

export class AppleCustomOAuth extends CustomOAuth {
	override async getIdentity(_accessToken: string, query: Record<string, any>): Promise<any> {
		const { id_token: identityToken, user: userStr = '' } = query;

		let usrObj = {} as any;
		try {
			usrObj = JSON.parse(userStr);
		} catch (e) {
			// ignore
		}

		try {
			const clientId = settings.get<string>('Accounts_OAuth_Apple_id') || '';

			const serviceData = await handleIdentityToken(identityToken, clientId);

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
