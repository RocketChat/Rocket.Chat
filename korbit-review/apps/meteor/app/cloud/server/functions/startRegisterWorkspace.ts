import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { updateAuditedBySystem } from '../../../../server/settings/lib/auditedSettingUpdates';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

export async function startRegisterWorkspace(resend = false) {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (workspaceRegistered || process.env.TEST_MODE) {
		await syncWorkspace();

		return true;
	}
	(await Settings.updateValueById('Register_Server', true)).modifiedCount && void notifyOnSettingChangedById('Register_Server');

	const regInfo = await buildWorkspaceRegistrationData(undefined);

	let payload;
	try {
		const cloudUrl = settings.get<string>('Cloud_Url');
		const response = await fetch(`${cloudUrl}/api/v2/register/workspace`, {
			method: 'POST',
			body: regInfo,
			params: {
				resend,
			},
		});
		if (!response.ok) {
			throw new Error((await response.json()).error);
		}

		payload = await response.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			err,
		});

		return false;
	}
	if (!payload) {
		return false;
	}

	await updateAuditedBySystem({
		reason: 'startRegisterWorkspace',
	})(Settings.updateValueById, 'Cloud_Workspace_Id', payload.id);

	return true;
}
