import { settings } from '../../app/settings';
import { NPS } from '../sdk';

function runNPS() {
	Promise.await(NPS.sendResults());
}

export function npsCron(SyncedCron) {
	if (!settings.get('Troubleshoot_Disable_Statistics_Generator')) {
		return;
	}

	const name = 'NPS';

	let previousValue;
	settings.get('NPS_opt_out', (key, value) => {
		if (value === previousValue) {
			return;
		}
		previousValue = value;

		if (value) {
			SyncedCron.remove(name);
			return;
		}

		SyncedCron.add({
			name,
			schedule(parser) {
				return parser.cron('0 3 * * *');
			},
			job: runNPS,
		});
	});
}
