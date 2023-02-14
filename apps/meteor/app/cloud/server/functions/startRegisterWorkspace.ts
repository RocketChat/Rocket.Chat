import { HTTP } from 'meteor/http';
import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function startRegisterWorkspace(resend = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if ((workspaceRegistered && connectToCloud) || process.env.TEST_MODE) {
		await syncWorkspace(true);

		return true;
	}

	await Settings.updateValueById('Register_Server', true);

	const regInfo = await buildWorkspaceRegistrationData(undefined);

	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.post(`${cloudUrl}/api/v2/register/workspace?resend=${resend}`, {
			data: regInfo,
		});
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		return false;
	}
	const { data } = result;
	if (!data) {
		return false;
	}

	await Settings.updateValueById('Cloud_Workspace_Id', data.id);

	return true;
}
