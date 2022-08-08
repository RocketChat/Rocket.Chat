import { Random } from 'meteor/random';
import { Settings } from '@rocket.chat/models';

import { getRedirectUri } from './getRedirectUri';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';

export async function getOAuthAuthorizationUrl() {
	const state = Random.id();

	await Settings.updateValueById('Cloud_Workspace_Registration_State', state);

	const cloudUrl = settings.get('Cloud_Url');
	const clientId = settings.get('Cloud_Workspace_Client_Id');
	const redirectUri = getRedirectUri();

	const scope = userScopes.join(' ');

	return `${cloudUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}
