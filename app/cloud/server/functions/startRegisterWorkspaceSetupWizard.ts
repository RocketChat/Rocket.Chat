import { HTTP } from 'meteor/http';

import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { CloudRegistrationIntentData } from '../../../../definition/ICloud';

export async function startRegisterWorkspaceSetupWizard(resend = false, email: string): Promise<CloudRegistrationIntentData> {
	const regInfo = await buildWorkspaceRegistrationData(email);
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.post(`${cloudUrl}/api/v2/register/workspace/intent?resent=${resend}`, {
			data: regInfo,
		});
	} catch (e: unknown) {
		if (e instanceof Error) {
			// e.response?.data?.error
			if (e.message) {
				SystemLogger.error(`Failed to register with Rocket.Chat Cloud.  ErrorCode: ${e.message}`);
			} else {
				SystemLogger.error(e);
			}

			throw e;
		}
	}

	// const { data } = result;
	const { data } = result?.data;

	if (!data) {
		throw new Error('Failed to fetch registration intent endpoint');
	}

	return data;
}
