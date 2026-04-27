import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';
import { tracerSpan } from '@rocket.chat/tracing';

import { statistics } from '..';
import { Info } from '../../../utils/rocketchat.info';

export async function sendUsageReport(logger: Logger): Promise<string | undefined> {
	return tracerSpan('generateStatistics', {}, async () => {
		logger.debug('offline-base: keeping usage statistics local only');

		const last = await Statistics.findLast();
		const currentVersion = Info.version;

		if (last && last.version === currentVersion) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			if (last.createdAt > yesterday) {
				return last.statsToken;
			}
		}

		const cronStatistics = await statistics.save();
		return cronStatistics.statsToken;
	});
}
