import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { userLoggedOut } from './userLoggedOut';

export async function userLogout(userId: string): Promise<string | boolean> {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = await Users.findOneById(userId);

	if (user?.services?.cloud?.refreshToken) {
		try {
			const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
			if (!clientId) {
				return '';
			}

			const clientSecret = settings.get('Cloud_Workspace_Client_Secret');

			const { refreshToken } = user.services.cloud;

			const cloudUrl = settings.get<string>('Cloud_Url');
			await fetch(`${cloudUrl}/api/oauth/revoke`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				params: {
					client_id: clientId,
					client_secret: clientSecret,
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
