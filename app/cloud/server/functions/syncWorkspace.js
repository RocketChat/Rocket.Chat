import { HTTP } from 'meteor/http';


import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { statistics } from '../../../statistics';
import { settings } from '../../../settings';

export function syncWorkspace(reconnectCheck = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if (!workspaceRegistered || (!connectToCloud && !reconnectCheck)) {
		return false;
	}

	const stats = statistics.get();

	const address = settings.get('Site_Url');

	const info = {
		uniqueId: stats.uniqueId,
		address,
		contactName: stats.wizard.contactName,
		contactEmail: stats.wizard.contactEmail,
		accountName: stats.wizard.organizationName,
		siteName: stats.wizard.siteName,
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
	};

	const workspaceUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');

	try {
		const headers = {};
		const token = getWorkspaceAccessToken(true);

		if (token) {
			headers.Authorization = `Bearer ${ token }`;
		} else {
			return false;
		}

		HTTP.post(`${ workspaceUrl }/client`, {
			data: info,
			headers,
		});

		getWorkspaceLicense();
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to sync with Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);
		} else {
			console.error(e);
		}

		return false;
	}

	return true;
}
