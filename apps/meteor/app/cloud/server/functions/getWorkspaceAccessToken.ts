import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessTokenWithScope } from './getWorkspaceAccessTokenWithScope';
import { settings } from '../../../settings/server';

/**
 * @param {boolean} forceNew
 * @param {string} scope
 * @param {boolean} save
 * @returns string
 */
export async function getWorkspaceAccessToken(forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	const expires = await Settings.findOneById('Cloud_Workspace_Access_Token_Expires_At');

	if (expires === null) {
		throw new Error('Cloud_Workspace_Access_Token_Expires_At is not set');
	}
	const now = new Date();

	if (expires.value && now < expires.value && !forceNew) {
		return settings.get('Cloud_Workspace_Access_Token');
	}

	const accessToken = getWorkspaceAccessTokenWithScope(scope);

	if (save) {
		await Promise.all([
			Settings.updateValueById('Cloud_Workspace_Access_Token', accessToken.token),
			Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', accessToken.expiresAt),
		]);
	}

	return accessToken.token;
}
