import { Random } from 'meteor/random';

import { getRedirectUri } from './getRedirectUri';

export function getOAuthAuthorizationUrl() {
	const state = Random.id();

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Registration_State', state);

	const cloudUrl = RocketChat.settings.get('Cloud_Url');
	const client_id = RocketChat.settings.get('Cloud_Workspace_Client_Id');
	const redirectUri = getRedirectUri();

	return `${ cloudUrl }/authorize?response_type=code&client_id=${ client_id }&redirect_uri=${ redirectUri }&scope=offline_access&state=${ state }`;
}
