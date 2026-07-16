import { Settings } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { getRedirectUri } from './getRedirectUri';
import { userScopes } from './oauthScopes';
import { settings } from '../../settings';
import { updateAuditedBySystem } from '../../settings/lib/auditedSettingUpdates';
import { notifyOnSettingChangedById } from '../notifyListener';

export async function getOAuthAuthorizationUrl() {
	const state = Random.id();

	await updateAuditedBySystem({
		reason: 'getOAuthAuthorizationUrl',
	})(Settings.updateValueById, 'Cloud_Workspace_Registration_State', state);

	void notifyOnSettingChangedById('Cloud_Workspace_Registration_State');

	const cloudUrl = settings.get('Cloud_Url');
	const clientId = settings.get('Cloud_Workspace_Client_Id');
	const redirectUri = getRedirectUri();

	const scope = userScopes.join(' ');

	return `${cloudUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}
