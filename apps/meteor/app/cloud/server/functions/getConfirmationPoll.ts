import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getConfirmationPoll(deviceCode: string): Promise<CloudConfirmationPollData> {
	const cloudUrl = settings.get('Cloud_Url');

	let result;
	try {
		const request = await fetch(`${cloudUrl}/api/v2/register/workspace/poll`, { params: { token: deviceCode } });
		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get confirmation poll from Rocket.Chat Cloud',
			url: '/api/v2/register/workspace/poll',
			err,
		});

		throw err;
	}

	if (!result) {
		throw new Error('Failed to retrieve registration confirmation poll data');
	}

	return result;
}
