import type { SettingValue } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';

import { settings } from '../../app/settings/server';
import * as dataExport from '../lib/dataExport';

export const userDataDownloadsCron = (): void => {
	const jobName = 'Generate download files for user data';
	const name = 'UserDataDownload';

	const plug = async ({
		disabled,
		processingFrequency,
	}: {
		disabled: boolean;
		processingFrequency: number;
	}): Promise<(() => Promise<void>) | undefined> => {
		if (disabled) {
			return;
		}

		await cronJobs.add(name, `*/${processingFrequency} * * * *`, async () => dataExport.processDataDownloads());

		return async () => {
			await cronJobs.remove(jobName);
		};
	};

	let unplug: (() => void) | undefined;

	settings.watchMultiple(
		['Troubleshoot_Disable_Data_Exporter_Processor', 'UserData_ProcessingFrequency'],
		async ([disabled, processingFrequency]: SettingValue[]): Promise<void> => {
			await unplug?.();
			unplug = await plug({
				disabled: disabled === true,
				processingFrequency: typeof processingFrequency === 'number' && processingFrequency > 0 ? processingFrequency : 2,
			});
		},
	);
};
