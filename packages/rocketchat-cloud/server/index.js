import './methods';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceLicense } from './functions/getWorkspaceLicense';

if (RocketChat.models && RocketChat.models.Permissions) {
	RocketChat.models.Permissions.createOrUpdate('manage-cloud', ['admin']);
}

// Ensure the client/workspace access token is valid
getWorkspaceAccessToken();

export { getWorkspaceAccessToken, getWorkspaceLicense };
