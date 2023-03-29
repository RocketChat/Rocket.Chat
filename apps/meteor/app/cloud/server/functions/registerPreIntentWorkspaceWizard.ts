import { HTTP } from 'meteor/http';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { Users } from '../../../models/server';

export async function registerPreIntentWorkspaceWizard(): Promise<boolean> {
	const firstUser = Users.getOldest({ name: 1, emails: 1 }) as IUser | undefined;
	const email = firstUser?.emails?.find((address) => address)?.address || '';

	const regInfo = await buildWorkspaceRegistrationData(email);
	const cloudUrl = settings.get('Cloud_Url');

	try {
		HTTP.post(`${cloudUrl}/api/v2/register/workspace/pre-intent`, {
			data: regInfo,
			timeout: 10 * 1000,
		});

		return true;
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to register workspace pre-intent with Rocket.Chat Cloud',
			url: '/api/v2/register/workspace/pre-intent',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		return false;
	}
}
