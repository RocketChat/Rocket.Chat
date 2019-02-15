import './methods';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceLicense } from './functions/getWorkspaceLicense';

import { Permissions } from 'meteor/rocketchat:models';

if (Permissions) {
	Permissions.createOrUpdate('manage-cloud', ['admin']);
}

// Ensure the client/workspace access token is valid
getWorkspaceAccessToken();

export { getWorkspaceAccessToken, getWorkspaceLicense };
