import { HTTP } from 'meteor/http';
import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getConfirmationPoll(deviceCode: string): Promise<CloudConfirmationPollData> {
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.get(`${cloudUrl}/api/v2/register/workspace/poll?token=${deviceCode}`);
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get confirmation poll from Rocket.Chat Cloud',
			url: '/api/v2/register/workspace/poll',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		throw err;
	}

	const { data } = result;
	if (!data) {
		throw new Error('Failed to retrieve registration confirmation poll data');
	}

	return data;
}
