import { HTTP } from 'meteor/http';

import { userLoggedOut } from './userLoggedOut';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function userLogout(userId) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = Users.findOneById(userId);

	if (user && user.services && user.services.cloud && user.services.cloud.refreshToken) {
		try {
			const client_id = settings.get('Cloud_Workspace_Client_Id');
			if (!client_id) {
				return '';
			}

			const cloudUrl = settings.get('Cloud_Url');
			const client_secret = settings.get('Cloud_Workspace_Client_Secret');

			const { refreshToken } = user.services.cloud;

			HTTP.post(`${cloudUrl}/api/oauth/revoke`, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				params: {
					client_id,
					client_secret,
					token: refreshToken,
					token_type_hint: 'refresh_token',
				},
			});
		} catch (err) {
			SystemLogger.error({
				msg: 'Failed to get Revoke refresh token to logout of Rocket.Chat Cloud',
				url: '/api/oauth/revoke',
				...(err.response?.data && { cloudError: err.response.data }),
				err,
			});
		}
	}

	return userLoggedOut(userId);
}
