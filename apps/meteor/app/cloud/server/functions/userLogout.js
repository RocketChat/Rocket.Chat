import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { userLoggedOut } from './userLoggedOut';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function userLogout(userId) {
	const { connectToCloud, workspaceRegistered } = await retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = await Users.findOneById(userId);

	if (user && user.services && user.services.cloud && user.services.cloud.refreshToken) {
		try {
			const client_id = settings.get('Cloud_Workspace_Client_Id');
			if (!client_id) {
				return '';
			}

			const cloudUrl = settings.get('Cloud_Url');
			const client_secret = settings.get('Cloud_Workspace_Client_Secret');

			const { refreshToken } = user.services.cloud;
			await fetch(`${cloudUrl}/api/oauth/revoke`, {
				method: 'POST',
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
				err,
			});
		}
	}

	return userLoggedOut(userId);
}
