import { Meteor } from 'meteor/meteor';
import type { INpsVote } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { SystemLogger } from '../../lib/logger/system';
import { fetch } from '../../lib/http/fetch';

type NPSResultPayload = {
	total: number;
	votes: Pick<INpsVote, 'identifier' | 'roles' | 'score' | 'comment'>[];
};

export const sendNpsResults = Meteor.bindEnvironment(async function sendNpsResults(npsId: string, data: NPSResultPayload) {
	const token = await getWorkspaceAccessToken();
	if (!token) {
		return false;
	}

	const npsUrl = settings.get('Nps_Url');

	try {
		return (
			await fetch(`${npsUrl}/v1/surveys/${npsId}/results`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			})
		).json();
	} catch (e) {
		SystemLogger.error(e);
		return false;
	}
});
