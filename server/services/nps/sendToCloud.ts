import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { INpsVote } from '../../../definition/INps';

type NPSResultPayload = {
	total: number;
	votes: INpsVote[];
}

export const sendToCloud = Meteor.bindEnvironment(function sendToCloud(npsId: string, data: NPSResultPayload) {
	const token: string = getWorkspaceAccessToken(true);
	if (!token) {
		return false;
	}

	const cloudUrl = settings.get('Cloud_Url');

	try {
		return HTTP.post(`${ cloudUrl }/v1/nps/surveys/${ npsId }/results`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
			data,
		});
	} catch (e) {
		throw new Error(e);
	}
});
