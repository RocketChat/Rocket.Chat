import { HTTP } from 'meteor/http';


import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { statistics } from '../../../statistics';
import { Settings } from '../../../models';
import { settings } from '../../../settings';

export function syncWorkspace(reconnectCheck = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if (!workspaceRegistered || (!connectToCloud && !reconnectCheck)) {
		return false;
	}

	const stats = statistics.get();

	const address = settings.get('Site_Url');
	const siteName = settings.get('Site_Name');

	const info = {
		uniqueId: stats.uniqueId,
		address,
		siteName,
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
	};

	const workspaceUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');

	let result;
	try {
		const headers = {};
		const token = getWorkspaceAccessToken(true);

		if (token) {
			headers.Authorization = `Bearer ${ token }`;
		} else {
			return false;
		}

		result = HTTP.post(`${ workspaceUrl }/client`, {
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

	const { data } = result;

	if (data.publicKey) {
		Settings.updateValueById('Cloud_Workspace_PublicKey', data.publicKey);
	}

	return true;
}
