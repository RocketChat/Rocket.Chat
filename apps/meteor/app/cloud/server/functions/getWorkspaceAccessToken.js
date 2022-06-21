import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessTokenWithScope } from './getWorkspaceAccessTokenWithScope';
import { Settings } from '../../../models/server';
import { settings } from '../../../settings/server';

/**
 * @param {boolean} forceNew
 * @param {string} scope
 * @param {boolean} save
 * @returns string
 */
export function getWorkspaceAccessToken(forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	const expires = Settings.findOneById('Cloud_Workspace_Access_Token_Expires_At');
	const now = new Date();

	if (now < expires.value && !forceNew) {
		return settings.get('Cloud_Workspace_Access_Token');
	}

	const accessToken = getWorkspaceAccessTokenWithScope(scope);

	if (save) {
		Settings.updateValueById('Cloud_Workspace_Access_Token', accessToken.token);
		Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', accessToken.expiresAt);
	}

	return accessToken.token;
}
