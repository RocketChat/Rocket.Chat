import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';

export async function getConfirmationPoll(deviceCode: string): Promise<CloudConfirmationPollData> {
	let payload;
	try {
		const cloudUrl = settings.get<string>('Cloud_Url');
		const response = await fetch(`${cloudUrl}/api/v2/register/workspace/poll`, { params: { token: deviceCode } });

		if (!response.ok) {
			throw new Error((await response.json()).error);
		}

		payload = await response.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get confirmation poll from Rocket.Chat Cloud',
			url: '/api/v2/register/workspace/poll',
			err,
		});

		throw err;
	}

	if (!payload) {
		throw new Error('Failed to retrieve registration confirmation poll data');
	}

	return payload;
}
