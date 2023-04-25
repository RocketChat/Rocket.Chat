import { Meteor } from 'meteor/meteor';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics/server';
import { settings } from '../../app/settings/server';

async function generateStatistics(logger) {
	const cronStatistics = await statistics.save();

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

export function statsCron(SyncedCron, logger) {
	if (settings.get('Troubleshoot_Disable_Statistics_Generator')) {
		return;
	}

	const name = 'Generate and save statistics';

	let previousValue;
	settings.watch('Troubleshoot_Disable_Statistics_Generator', (value) => {
		if (value === previousValue) {
			return;
		}
		previousValue = value;

		if (value) {
			SyncedCron.remove(name);
			return;
		}

		generateStatistics(logger);

		const now = new Date();

		SyncedCron.add({
			name,
			schedule(parser) {
				return parser.cron(`12 ${now.getHours()} * * *`);
			},
			job: () => generateStatistics(logger),
		});
	});
}
