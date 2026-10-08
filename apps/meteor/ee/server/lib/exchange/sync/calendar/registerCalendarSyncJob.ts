import { cronJobs } from '@rocket.chat/cron';
import { isValidCron } from 'cron-validator';

import { runCalendarSync } from './runCalendarSync';
import { settings } from '../../../../../../server/settings';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

export const CALENDAR_SYNC_JOB = 'Exchange_Calendar_Sync';

const WATCHED_SETTINGS = ['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Calendar_Sync_Interval'];

export const DEFAULT_INTERVAL_HOURS = 1;

const stopExchangeSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(CALENDAR_SYNC_JOB)) {
		await cronJobs.remove(CALENDAR_SYNC_JOB);
	}
};

const fitHours = (hours: number): number => {
	for (let step = Math.min(hours, 24); step > 1; step--) {
		if (24 % step === 0) {
			return step;
		}
	}

	return 1;
};

const intervalToCron = (hours: number): string => {
	const step = fitHours(Math.trunc(hours) > 0 ? Math.trunc(hours) : DEFAULT_INTERVAL_HOURS);

	return step === 24 ? '0 0 * * *' : `0 */${step} * * *`;
};

export const configureCalendarSyncJob = async (isCurrent: () => boolean = () => true): Promise<void> => {
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

	if (!isCurrent()) {
		return;
	}

	logger.info({ msg: 'Scheduling the Exchange calendar sync job', schedule });

	await cronJobs.add(CALENDAR_SYNC_JOB, schedule, async () => runCalendarSync());
};

export const registerCalendarSyncJob = (): (() => void) => {
	let generation = 0;
	let stopped = false;

	const stopWatching = settings.watchMultiple(WATCHED_SETTINGS, () => {
		const started = ++generation;

		void configureCalendarSyncJob(() => !stopped && generation === started).catch((err) =>
			logger.error({ msg: 'Could not configure the Exchange calendar sync job', err: scrubForLog(err) }),
		);
	});

	return () => {
		stopped = true;
		stopWatching();

		void stopExchangeSyncJob().catch((err) =>
			logger.error({ msg: 'Could not stop the Exchange calendar sync job during cleanup', err: scrubForLog(err) }),
		);
	};
};
