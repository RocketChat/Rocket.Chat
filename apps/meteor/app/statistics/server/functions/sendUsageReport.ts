import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { tracerSpan } from '@rocket.chat/tracing';
import { Meteor } from 'meteor/meteor';

import { statistics } from '..';
import { getWorkspaceAccessToken } from '../../../cloud/server';

export async function sendUsageReport(logger: Logger): Promise<string | undefined> {
	return tracerSpan('generateStatistics', {}, async () => {
		const cronStatistics = await statistics.save();

		try {
			const token = await getWorkspaceAccessToken();
			const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

			const query = {
				method: 'POST',
				body: {
					...cronStatistics,
					host: Meteor.absoluteUrl(),
				},
				headers,
			};

			logger.debug('Send Usage Report query: ', query);

			const response = await fetch('https://collector.rocket.chat/', query);

			const parsedResponse = await response.json();

			logger.debug('Send Usage Report response: ', parsedResponse);

			const { statsToken } = parsedResponse;
			if (statsToken != null) {
				await Statistics.updateOne({ _id: cronStatistics._id }, { $set: { statsToken } });
				return statsToken;
			}
		} catch (error) {
			/* error*/
			logger.warn('Failed to send usage report');
			logger.debug('Send Usage Report error: ', error);
		}
	});
}
