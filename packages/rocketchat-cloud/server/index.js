import './methods';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessTokens';

import { Permissions } from 'meteor/rocketchat:models';

if (Permissions) {
	Permissions.createOrUpdate('manage-cloud', ['admin']);
}

// Ensure the client/workspace access token is valid
getWorkspaceAccessToken();

export { getWorkspaceAccessToken };
