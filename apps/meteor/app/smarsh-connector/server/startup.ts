import { settings } from '../../settings/server';
import { generateEml } from './functions/generateEml';
import { defaultCronJobs } from '../../utils/server/lib/cron/Cronjobs';

const smarshJobName = 'Smarsh EML Connector';

settings.watchMultiple(
	['Smarsh_Enabled', 'Smarsh_Email', 'From_Email', 'Smarsh_Interval'],
	async function __addSmarshSyncedCronJobDebounced() {
		if (await defaultCronJobs.has(smarshJobName)) {
			await defaultCronJobs.remove(smarshJobName);
		}

		if (settings.get('Smarsh_Enabled') && settings.get('Smarsh_Email') !== '' && settings.get('From_Email') !== '') {
			await defaultCronJobs.add(smarshJobName, settings.get<string>('Smarsh_Interval').replace(/_/g, ' '), async () => generateEml());
		}
	},
);
