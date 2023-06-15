import type { CloudRegistrationIntentData } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function startRegisterWorkspaceSetupWizard(resend = false, email: string): Promise<CloudRegistrationIntentData> {
	const regInfo = await buildWorkspaceRegistrationData(email);
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		const request = await fetch(`${cloudUrl}/api/v2/register/workspace/intent`, {
			body: regInfo,
			method: 'POST',
			params: {
				resent: resend,
			},
		});
		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register workspace intent with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			err,
		});

		throw err;
	}

	if (!result) {
		throw new Error('Failed to fetch registration intent endpoint');
	}

	return result;
}
