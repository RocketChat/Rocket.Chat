import { cronJobs } from '@rocket.chat/cron';
import { isValidCron } from 'cron-validator';

import { runCalendarSync } from './runCalendarSync';
import { settings } from '../../../../../../server/settings';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

export const CALENDAR_SYNC_JOB = 'Exchange_Calendar_Sync';

const WATCHED_SETTINGS = ['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Calendar_Sync_Interval'];

export const DEFAULT_INTERVAL_MINUTES = 15;

const stopExchangeSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(CALENDAR_SYNC_JOB)) {
		await cronJobs.remove(CALENDAR_SYNC_JOB);
	}
};

const intervalToCron = (minutes: number): string => {
	const value = Math.trunc(minutes) > 0 ? Math.trunc(minutes) : DEFAULT_INTERVAL_MINUTES;

	if (value < 60) {
		return `*/${value} * * * *`;
	}

	// If greater than or equal to 60, it's converted to hours
	return `0 */${Math.min(Math.round(value / 60), 23)} * * *`;
};

export const configureCalendarSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(CALENDAR_SYNC_JOB)) {
		await cronJobs.remove(CALENDAR_SYNC_JOB);
	}

	if (!settings.get<boolean>('Outlook_Calendar_Enabled') || settings.get<string>('Exchange_Mode') !== 'server') {
		return;
	}

	const schedule = intervalToCron(settings.get<number>('Exchange_Calendar_Sync_Interval'));

	// An invalid expression does not throw at add() time, it yields no next run and the job never fires.
	if (!isValidCron(schedule)) {
		logger.error({ msg: 'Refusing to schedule the Exchange calendar sync job with an invalid schedule', schedule });
		return;
	}

	logger.info({ msg: 'Scheduling the Exchange calendar sync job', schedule });

	await cronJobs.add(CALENDAR_SYNC_JOB, schedule, async () => runCalendarSync());
};

export const registerCalendarSyncJob = (): (() => void) => {
	const stopWatching = settings.watchMultiple(WATCHED_SETTINGS, () => {
		void configureCalendarSyncJob().catch((err) =>
			logger.error({ msg: 'Could not configure the Exchange calendar sync job', err: scrubForLog(err) }),
		);
	});

	return () => {
		stopWatching();

		void stopExchangeSyncJob().catch((err) =>
			logger.error({ msg: 'Could not stop the Exchange calendar sync job during cleanup', err: scrubForLog(err) }),
		);
	};
};
