import { Random } from 'meteor/random';
import { Settings } from '/app/models';
import { settings } from '/app/settings';

import { getRedirectUri } from './getRedirectUri';

export function getOAuthAuthorizationUrl() {
	const state = Random.id();

	Settings.updateValueById('Cloud_Workspace_Registration_State', state);

	const cloudUrl = settings.get('Cloud_Url');
	const client_id = settings.get('Cloud_Workspace_Client_Id');
	const redirectUri = getRedirectUri();

	return `${ cloudUrl }/authorize?response_type=code&client_id=${ client_id }&redirect_uri=${ redirectUri }&scope=offline_access&state=${ state }`;
}
