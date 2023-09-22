import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';

export async function startRegisterWorkspace(resend = false) {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (workspaceRegistered || process.env.TEST_MODE) {
		await syncWorkspace(true);

		return true;
	}

	await Settings.updateValueById('Register_Server', true);

	const regInfo = await buildWorkspaceRegistrationData(undefined);

	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		const request = await fetch(`${cloudUrl}/api/v2/register/workspace`, {
			method: 'POST',
			body: regInfo,
			params: {
				resend,
			},
		});
		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			err,
		});

		return false;
	}
	if (!result) {
		return false;
	}

	await Settings.updateValueById('Cloud_Workspace_Id', result.id);

	return true;
}
