import { settings } from '../../app/settings';
import { NPS } from '../sdk';

function runNPS() {
	// if NPS is disabled close any pending scheduled survey
	const enabled = settings.get('NPS_survey_enabled');
	if (!enabled) {
		Promise.await(NPS.closeOpenSurveys());
		return;
	}
	Promise.await(NPS.sendResults());
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
