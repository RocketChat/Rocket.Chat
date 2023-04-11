import { NPS } from '@rocket.chat/core-services';

import { settings } from '../../app/settings/server';
import { defaultCronJobs } from '../../app/utils/server/lib/cron/Cronjobs';

async function runNPS(): Promise<void> {
	// if NPS is disabled close any pending scheduled survey
	const enabled = settings.get('NPS_survey_enabled');
	if (!enabled) {
		await NPS.closeOpenSurveys();
		return;
	}
	await NPS.sendResults();
}

export async function npsCron(): Promise<void> {
	await defaultCronJobs.add('NPS', '21 15 * * *', async () => runNPS());
}
