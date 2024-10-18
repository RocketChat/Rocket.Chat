import type { IStats } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics/server';

async function sendStats(logger: Logger, cronStatistics: IStats) {
	try {
		const token = await getWorkspaceAccessToken();
		const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

		const response = await fetch('https://collector.rocket.chat/', {
			method: 'POST',
			body: {
				...cronStatistics,
				host: Meteor.absoluteUrl(),
			},
			headers,
		});

		const { statsToken } = await response.json();

		if (statsToken != null) {
			await Statistics.updateOne({ _id: cronStatistics._id }, { $set: { statsToken } });
		}
	} catch (error) {
		/* error*/
		logger.warn('Failed to send usage report');
	}
}

async function generateStatistics(logger: Logger): Promise<void> {
	const last = await Statistics.findLast();
	if (last) {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		// if the last data we have has less than 24h and was not sent to yet, send it
		if (last.createdAt > yesterday) {
			// if it has the confirmation token, we can skip
			if (last.statsToken) {
				return;
			}
			await sendStats(logger, last);
			return;
		}
	}

	// if our latest stats has more than 24h, it is time to generate a new one and send it
	const cronStatistics = await statistics.save();

	await sendStats(logger, cronStatistics);
}

export async function statsCron(logger: Logger): Promise<void> {
	const name = 'Generate and save statistics';
	await generateStatistics(logger);

	const now = new Date();

	// let's schedule to run 12h apart from now (we're assuming the process is being started in business hours)
	const hours = now.getHours() + (now.getHours() < 12 ? 12 : -12);

	await cronJobs.add(name, `12 ${hours} * * *`, async () => {
		await generateStatistics(logger);
	});
}
