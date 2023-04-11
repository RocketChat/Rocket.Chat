import { Meteor } from 'meteor/meteor';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics/server';
import { settings } from '../../app/settings/server';
import { fetch } from '../lib/http/fetch';
import type { Logger } from '../lib/logger/Logger';
import { defaultCronJobs } from '../../app/utils/server/lib/cron/Cronjobs';

async function generateStatistics(logger: Logger): Promise<void> {
	const cronStatistics: Record<string, any> = await statistics.save();

	cronStatistics.host = Meteor.absoluteUrl();

	if (!settings.get('Statistics_reporting')) {
		return;
	}

	try {
		const headers: Record<string, any> = {};
		const token = await getWorkspaceAccessToken();

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		await fetch('https://collector.rocket.chat/', {
			method: 'POST',
			body: JSON.stringify(cronStatistics),
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
			await defaultCronJobs.remove(name);
			return;
		}

		await generateStatistics(logger);

		const now = new Date();

		await defaultCronJobs.add(name, `12 ${now.getHours()} * * *`, async () => generateStatistics(logger));
	});
}
