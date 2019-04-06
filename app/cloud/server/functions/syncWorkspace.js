import { HTTP } from 'meteor/http';
import { settings } from '../../../settings';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';

import { statistics } from '../../../statistics';
import { getWorkspaceLicense } from './getWorkspaceLicense';

export function syncWorkspace() {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if (!workspaceRegistered || !connectToCloud) {
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

		HTTP.post(`${ workspaceUrl }/registration`, {
			data: info,
			headers,
		});

	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to sync with Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);
		}

		return false;
	}

	return getWorkspaceLicense();
}
