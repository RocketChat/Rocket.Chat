import { cronJobs } from '@rocket.chat/cron';
import { isValidCron } from 'cron-validator';

import { runExchangeSync } from './runExchangeSync';
import { settings } from '../../../../../server/settings';
import { logger } from '../logger';
import { scrubForLog } from '../scrub';

export const EXCHANGE_SYNC_JOB = 'Outlook_Calendar_Server_Sync';

const WATCHED_SETTINGS = ['Outlook_Calendar_Enabled', 'Outlook_Calendar_Mode', 'Outlook_Calendar_Server_Sync_Interval'];

const DEFAULT_INTERVAL_MINUTES = 15;

export const intervalToCron = (minutes: number): string => {
	const value = Math.trunc(minutes) > 0 ? Math.trunc(minutes) : DEFAULT_INTERVAL_MINUTES;

	if (value < 60) {
		return `*/${value} * * * *`;
	}

	return `0 */${Math.min(Math.round(value / 60), 23)} * * *`;
};

export const configureExchangeSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(EXCHANGE_SYNC_JOB)) {
		await cronJobs.remove(EXCHANGE_SYNC_JOB);
	}

	if (!settings.get<boolean>('Outlook_Calendar_Enabled') || settings.get<string>('Outlook_Calendar_Mode') !== 'server') {
		return;
	}

	const schedule = intervalToCron(settings.get<number>('Outlook_Calendar_Server_Sync_Interval'));

	// An invalid expression does not throw at add() time, it yields no next run and the job never fires.
	if (!isValidCron(schedule)) {
		logger.error({ msg: 'Refusing to schedule the Exchange sync job with an invalid schedule', schedule });
		return;
	}

	logger.info({ msg: 'Scheduling the Exchange sync job', schedule });

	await cronJobs.add(EXCHANGE_SYNC_JOB, schedule, async () => runExchangeSync());
};

export const registerExchangeSyncJob = (): (() => void) =>
	settings.watchMultiple(WATCHED_SETTINGS, () => {
		// The watcher callback is sync, so a rejection here would otherwise be unhandled.
		void configureExchangeSyncJob().catch((err) =>
			logger.error({ msg: 'Could not configure the Exchange sync job', err: scrubForLog(err) }),
		);
	});

export const stopExchangeSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(EXCHANGE_SYNC_JOB)) {
		await cronJobs.remove(EXCHANGE_SYNC_JOB);
	}
};
