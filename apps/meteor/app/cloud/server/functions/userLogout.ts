import { HTTP } from 'meteor/http';

import { userLoggedOut } from './userLoggedOut';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function userLogout(userId?: string) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = Users.findOneById(userId);

	if (user?.services?.cloud?.refreshToken) {
		try {
			const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
			if (!clientId) {
				return '';
			}

			const cloudUrl = settings.get('Cloud_Url');
			const clientSecret = settings.get<string>('Cloud_Workspace_Client_Secret');

			const { refreshToken } = user.services.cloud;

			HTTP.post(`${cloudUrl}/api/oauth/revoke`, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				params: {
					client_id: clientId,
					client_secret: clientSecret,
					token: refreshToken,
					token_type_hint: 'refresh_token',
				},
			});
		} catch (err: any) {
			SystemLogger.error({
				msg: 'Failed to get Revoke refresh token to logout of Rocket.Chat Cloud',
				url: '/api/oauth/revoke',
				...(err.response?.data?.error && { errorMessage: err.response.data.error }),
				err,
			});
		}
	}

	return userLoggedOut(userId);
}
