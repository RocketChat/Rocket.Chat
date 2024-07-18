import { cronJobs } from '@rocket.chat/cron';
import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { context, trace, ROOT_CONTEXT } from '@rocket.chat/tracing';
import { Meteor } from 'meteor/meteor';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics/server';

async function generateStatistics(logger: Logger): Promise<void> {
	const cronStatistics = await statistics.save();

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

const tracer = trace.getTracer('core');

export async function statsCron(logger: Logger): Promise<void> {
	const name = 'Generate and save statistics';
	const span = tracer.startSpan(`generateStatistics`);

	await context.with(trace.setSpan(ROOT_CONTEXT, span), async () => {
		await generateStatistics(logger);
	});

	span.end();

	const now = new Date();

	await cronJobs.add(name, `12 ${now.getHours()} * * *`, async () => {
		const span = tracer.startSpan(`generateStatistics`);

		await context.with(trace.setSpan(ROOT_CONTEXT, span), async () => {
			await generateStatistics(logger);
		});

		span.end();
	});
}
