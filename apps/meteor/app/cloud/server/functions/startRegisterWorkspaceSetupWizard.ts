import { HTTP } from 'meteor/http';
import type { CloudRegistrationIntentData } from '@rocket.chat/core-typings';

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
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register workspace intent with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		throw err;
	}

	const { data } = result;

	if (!data) {
		throw new Error('Failed to fetch registration intent endpoint');
	}

	return data;
}
