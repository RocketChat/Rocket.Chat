import type { SettingValue } from '@rocket.chat/core-typings';
import type { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../app/settings/server';
import * as dataExport from '../lib/dataExport';

export const userDataDownloadsCron = (cron: typeof SyncedCron): void => {
	const jobName = 'Generate download files for user data';

	const plug = ({ disabled, processingFrequency }: { disabled: boolean; processingFrequency: number }): (() => void) | undefined => {
		if (disabled) {
			return;
		}

		cron.add({
			name: jobName,
			schedule: (parser) => parser.cron(`*/${processingFrequency} * * * *`),
			job: dataExport.processDataDownloads,
		});

		return () => {
			cron.remove(jobName);
		};
	};

	let unplug: (() => void) | undefined;

	settings.watchMultiple(
		['Troubleshoot_Disable_Data_Exporter_Processor', 'UserData_ProcessingFrequency'],
		([disabled, processingFrequency]: SettingValue[]): void => {
			unplug?.();
			unplug = plug({
				disabled: disabled === true,
				processingFrequency: typeof processingFrequency === 'number' && processingFrequency > 0 ? processingFrequency : 2,
			});
		},
	);
};
