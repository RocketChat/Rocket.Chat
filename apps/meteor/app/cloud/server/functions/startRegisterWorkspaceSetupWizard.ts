import { HTTP } from 'meteor/http';
import { CloudRegistrationIntentData } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function startRegisterWorkspaceSetupWizard(resend = false, email: string): Promise<CloudRegistrationIntentData> {
	const regInfo = await buildWorkspaceRegistrationData(email);
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.post(`${cloudUrl}/api/v2/register/workspace/intent?resent=${resend}`, {
			data: regInfo,
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			SystemLogger.error(`Failed to register with Rocket.Chat Cloud.  ErrorCode: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
		}

		throw e;
	}

	const { data } = result;

	if (!data) {
		throw new Error('Failed to fetch registration intent endpoint');
	}

	return data;
}
