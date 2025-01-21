import { cronJobs } from '@rocket.chat/cron';
import { AirGappedRestriction } from '@rocket.chat/license';
import type { Logger } from '@rocket.chat/logger';

import { sendUsageReport } from '../../app/statistics/server/functions/sendUsageReport';

export async function usageReportCron(logger: Logger): Promise<void> {
	const name = 'Generate and save statistics';
	const statsToken = await sendUsageReport(logger);
	void AirGappedRestriction.computeRestriction(statsToken);

	const now = new Date();

	return cronJobs.add(name, `12 ${now.getHours()} * * *`, async () => {
		const statsToken = await sendUsageReport(logger);
		void AirGappedRestriction.computeRestriction(statsToken);
	});
}
