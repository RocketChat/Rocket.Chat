import { HTTP } from 'meteor/http';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';
import { settings } from '../../../settings';
import { Settings, Users } from '../../../models';
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
	const siteName = settings.get('Site_Name');

	// If we have it lets send it because likely an update
	const workspaceId = settings.get('Cloud_Workspace_Id');

	const firstUser = Users.getOldest({ name: 1, emails: 1 });
	const contactName = firstUser && firstUser.name;
	let contactEmail = firstUser && firstUser.emails && firstUser.emails[0].address;

	if (settings.get('Organization_Email')) {
		contactEmail = settings.get('Organization_Email');
	}

	const allowMarketing = settings.get('Allow_Marketing_Emails');

	const accountName = settings.get('Organization_Name');
	const website = settings.get('Website');

	const regInfo = {
		uniqueId: stats.uniqueId,
		workspaceId,
		address,
		contactName,
		contactEmail,
		allowMarketing,
		accountName,
		website,
		siteName,
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
