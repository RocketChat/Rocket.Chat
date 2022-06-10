import { HTTP } from 'meteor/http';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';
import { settings } from '../../../settings/server';
import { Settings } from '../../../models';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function startRegisterWorkspace(resend = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if ((workspaceRegistered && connectToCloud) || process.env.TEST_MODE) {
		await syncWorkspace(true);

		return true;
	}

	Settings.updateValueById('Register_Server', true);

	const regInfo = await buildWorkspaceRegistrationData();

	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.post(`${cloudUrl}/api/v2/register/workspace?resend=${resend}`, {
			data: regInfo,
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			SystemLogger.error(`Failed to register with Rocket.Chat Cloud.  ErrorCode: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
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
