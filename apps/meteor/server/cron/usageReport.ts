import { cronJobs } from '@rocket.chat/cron';
import { AirGappedRestriction } from '@rocket.chat/license';
import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';

import { sendUsageReport } from '../../app/statistics/server/functions/sendUsageReport';

export const sendUsageReportAndComputeRestriction = async (statsToken?: string) => {
	// If the report failed to be sent we need to get the last existing token
	// to ensure that the restriction respects the warning period.
	// If no token is passed, the workspace will be instantly restricted.
	const token = statsToken || (await Statistics.findLastStatsToken());
	void AirGappedRestriction.computeRestriction(token);
};

export const shouldReportStatistics = () => process.env.RC_DISABLE_STATISTICS_REPORTING?.toLowerCase() !== 'true';

export async function usageReportCron(logger: Logger): Promise<void> {
	// The actual send suppression happens inside `sendUsageReport`, but since this
	// is the entry point, we log a warning here when reporting is disabled.
	if (!shouldReportStatistics()) {
		logger.warn(
			'Statistics reporting disabled via environment variable (RC_DISABLE_STATISTICS_REPORTING). This may impact product improvements.',
		);
	}

	const statsToken = await sendUsageReport(logger);
	await sendUsageReportAndComputeRestriction(statsToken);

	const name = 'Generate and save statistics';
	const now = new Date();

	return cronJobs.add(name, `12 ${now.getHours()} * * *`, async () => {
		const statsToken = await sendUsageReport(logger);
		await sendUsageReportAndComputeRestriction(statsToken);
	});
}
