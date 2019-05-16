import { HTTP } from 'meteor/http';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';
import { settings } from '../../../settings';
import { Settings } from '../../../models';
import { statistics } from '../../../statistics';


export function startRegisterWorkspace(resend = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if ((workspaceRegistered && connectToCloud) || process.env.TEST_MODE) {
		return true;
	}

	settings.updateById('Register_Server', true);

	// If we still have client id lets see if they are still good before trying to register
	if (workspaceRegistered) {
		if (syncWorkspace(true)) {
			return true;
		}
	}

	const stats = statistics.get();

	const address = settings.get('Site_Url');

	// If we have it lets send it because likely an update
	const workspaceId = settings.get('Cloud_Workspace_Id');

	const regInfo = {
		uniqueId: stats.uniqueId,
		workspaceId,
		address,
		contactName: stats.wizard.contactName,
		contactEmail: stats.wizard.contactEmail,
		accountName: stats.wizard.organizationName,
		siteName: stats.wizard.siteName,
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
	};

	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.post(`${ cloudUrl }/api/v2/register/workspace?resend=${ resend }`, {
			data: regInfo,
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to register with Rocket.Chat Cloud.  ErrorCode: ${ e.response.data.error }`);
		} else {
			console.error(e);
		}

		return false;
	}

	const { data } = result;

	if (!data) {
		return false;
	}

	Settings.updateValueById('Cloud_Workspace_Id', data.id);

	return true;
}
