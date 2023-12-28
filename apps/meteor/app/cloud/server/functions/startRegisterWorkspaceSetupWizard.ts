import type { CloudRegistrationIntentData } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';

export async function startRegisterWorkspaceSetupWizard(resend = false, email: string): Promise<CloudRegistrationIntentData> {
	const regInfo = await buildWorkspaceRegistrationData(email);

	let payload;
	try {
		const cloudUrl = settings.get<string>('Cloud_Url');
		const response = await fetch(`${cloudUrl}/api/v2/register/workspace/intent`, {
			body: regInfo,
			method: 'POST',
			params: {
				resent: resend,
			},
		});
		if (!response.ok) {
			throw new Error((await response.json()).error);
		}

		payload = await response.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register workspace intent with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace',
			err,
		});

		throw err;
	}

	if (!payload) {
		throw new Error('Failed to fetch registration intent endpoint');
	}

	return payload;
}
