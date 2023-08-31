import { cronJobs } from '@rocket.chat/cron';
import type { Logger } from '@rocket.chat/logger';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { settings } from '../../app/settings/server';
import { statistics } from '../../app/statistics/server';

async function generateStatistics(logger: Logger): Promise<void> {
	const cronStatistics: Record<string, any> = await statistics.save();

	cronStatistics.host = Meteor.absoluteUrl();

	if (!settings.get('Statistics_reporting')) {
		return;
	}

	try {
		const token = await getWorkspaceAccessToken();
		const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

		await fetch('https://collector.rocket.chat/', {
			method: 'POST',
			body: cronStatistics,
			headers,
		});
	} catch (error) {
		/* error*/
		logger.warn('Failed to send usage report');
	}
}

export async function statsCron(logger: Logger): Promise<void> {
	if (settings.get('Troubleshoot_Disable_Statistics_Generator')) {
		return;
	}

	const name = 'Generate and save statistics';

	let previousValue: boolean;
	settings.watch<boolean>('Troubleshoot_Disable_Statistics_Generator', async (value) => {
		if (value === previousValue) {
			return;
		}
		previousValue = value;

		if (value) {
			await cronJobs.remove(name);
			return;
		}

		await generateStatistics(logger);

		const now = new Date();

		await cronJobs.add(name, `12 ${now.getHours()} * * *`, async () => generateStatistics(logger));
	});
}
