import type { INpsVote } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../lib/cloud';
import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

type NPSResultPayload = {
	total: number;
	votes: Pick<INpsVote, 'identifier' | 'roles' | 'score' | 'comment'>[];
};

export const sendNpsResults = async function sendNpsResults(npsId: string, data: NPSResultPayload) {
	const token = await getWorkspaceAccessToken();
	if (!token) {
		return false;
	}

	const npsUrl = settings.get<string>('Nps_Url');

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- value comes from an untyped source
		return (
			await fetch(`${npsUrl}/v1/surveys/${npsId}/results`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: data,
				// SECURITY: URL can only be configured by users with enough privileges. It's ok to disable this check here.
				ignoreSsrfValidation: true,
			})
		).json();
	} catch (err) {
		SystemLogger.error({ err });
		return false;
	}
};
