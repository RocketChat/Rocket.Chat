import { HTTP } from 'meteor/http';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { CloudConfirmationPollData } from '../../../../definition/ICloud';

export async function getConfirmationPoll(deviceCode: string): Promise<CloudConfirmationPollData> {
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		result = HTTP.get(`${cloudUrl}/api/v2/register/workspace/poll?token=${deviceCode}`);
	} catch (e: unknown) {
		// e.response?.data?.error
		const message = e instanceof Error ? e.message : '';
		if (message) {
			SystemLogger.error(`Failed to register with Rocket.Chat Cloud. ErrorCode: ${message}`);
		} else {
			SystemLogger.error(e);
		}

		throw e;
	}

	const { data }: HTTP.HTTPResponse['data'] = result;

	if (!data) {
		throw new Error('Failed to retrieve registration confirmation poll data');
	}

	return data;
}
