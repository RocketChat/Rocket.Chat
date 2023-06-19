import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function registerPreIntentWorkspaceWizard(): Promise<boolean> {
	const firstUser = (await Users.getOldest({ projection: { name: 1, emails: 1 } })) as IUser | undefined;
	const email = firstUser?.emails?.find((address) => address)?.address;

	if (!email) {
		return false;
	}

	const regInfo = await buildWorkspaceRegistrationData(email);
	const cloudUrl = settings.get('Cloud_Url');

	try {
		const request = await fetch(`${cloudUrl}/api/v2/register/workspace/pre-intent`, {
			body: regInfo,
			timeout: 10 * 1000,
			method: 'POST',
		});
		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		return true;
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register workspace pre-intent with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace/pre-intent',
			err,
		});

		return false;
	}
}
