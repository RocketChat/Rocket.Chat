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

export async function usageReportCron(logger: Logger): Promise<void> {
	const name = 'Generate and save statistics';

	const statsToken = await sendUsageReport(logger);
	await sendUsageReportAndComputeRestriction(statsToken);

	const now = new Date();

	return cronJobs.add(name, `12 ${now.getHours()} * * *`, async () => {
		const statsToken = await sendUsageReport(logger);
		await sendUsageReportAndComputeRestriction(statsToken);
	});
}
