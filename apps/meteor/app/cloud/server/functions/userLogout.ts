import { HTTP } from 'meteor/http';
import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function userLogout(userId: string): Promise<void> {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return;
	}

	const user = await Users.findOneById<Pick<IUser, 'services'>>(userId, { projection: { 'services.cloud': 1 } });

	if (!user?.services?.cloud?.refreshToken) {
		return;
	}

	try {
		const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
		if (!clientId) {
			return;
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
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});
	}

	await Users.unsetCloudServicesById(userId);
}
