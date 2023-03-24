import { NPS } from '@rocket.chat/core-services';

import { settings } from '../../app/settings/server';

async function runNPS() {
	// if NPS is disabled close any pending scheduled survey
	const enabled = settings.get('NPS_survey_enabled');
	if (!enabled) {
		await NPS.closeOpenSurveys();
		return;
	}
	await NPS.sendResults();
}

export function npsCron(SyncedCron) {
	SyncedCron.add({
		name: 'NPS',
		schedule(parser) {
			return parser.cron('21 15 * * *');
		},
		job: runNPS,
	});
}
