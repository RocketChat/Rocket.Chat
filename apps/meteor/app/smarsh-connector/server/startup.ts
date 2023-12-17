import { cronJobs } from '@rocket.chat/cron';

import { smarshIntervalValuesToCronMap } from '../../../server/settings/smarsh';
import { settings } from '../../settings/server';
import { generateEml } from './functions/generateEml';

const smarshJobName = 'Smarsh EML Connector';

settings.watchMultiple(
	['Smarsh_Enabled', 'Smarsh_Email', 'From_Email', 'Smarsh_Interval'],
	async function __addSmarshSyncedCronJobDebounced() {
		if (await cronJobs.has(smarshJobName)) {
			await cronJobs.remove(smarshJobName);
		}

		if (settings.get('Smarsh_Enabled') && settings.get('Smarsh_Email') !== '' && settings.get('From_Email') !== '') {
			const cronInterval = smarshIntervalValuesToCronMap[settings.get<string>('Smarsh_Interval')];
			await cronJobs.add(smarshJobName, cronInterval, async () => generateEml());
		}
	},
);
