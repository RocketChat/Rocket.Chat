import { HTTP } from 'meteor/http';
import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getConfirmationPoll(deviceCode: string): Promise<CloudConfirmationPollData> {
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.get(`${cloudUrl}/api/v2/register/workspace/poll?token=${deviceCode}`);
	} catch (e: any) {
		if (e.response?.data?.error) {
			SystemLogger.error(`Failed to register with Rocket.Chat Cloud. ErrorCode: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
		}

		throw e;
	}

	const { data } = result;

	if (!data) {
		throw new Error('Failed to retrieve registration confirmation poll data');
	}

	return data;
}
