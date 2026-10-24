import { Calendar } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { ExchangeCalendarSyncState } from '@rocket.chat/models';
import { isValidCron } from 'cron-validator';

import { whenMailboxesIdle } from './mailboxLock';
import { runCalendarSync } from './runCalendarSync';
import { settings } from '../../../../../../server/settings';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

export const CALENDAR_SYNC_JOB = 'Exchange_Calendar_Sync';

const WATCHED_SETTINGS = ['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Calendar_Sync_Interval'];

export const DEFAULT_INTERVAL_HOURS = 1;

const stopCalendarSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(CALENDAR_SYNC_JOB)) {
		await cronJobs.remove(CALENDAR_SYNC_JOB);
	}
};

export const isServerSyncOn = (): boolean =>
	Boolean(settings.get<boolean>('Outlook_Calendar_Enabled')) && settings.get<string>('Exchange_Mode') === 'server';

/** Every await here is a chance for the switch to be undone, so `stillOff` is asked again before each step that cannot be */
const discardServerSyncedCalendarEvents = async (stillOff: () => boolean): Promise<void> => {
	const uids = await ExchangeCalendarSyncState.findAllUserIds();

	if (!stillOff()) {
		return;
	}

	await ExchangeCalendarSyncState.removeAll();

	if (!stillOff()) {
		return;
	}

	const deleted = await Calendar.discardImportedBySource('outlook', uids);

	logger.info({ msg: 'Discarded what the server-to-server Exchange calendar sync had imported', deleted });
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
	await stopCalendarSyncJob();

	if (!isServerSyncOn()) {
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

	// A guard to avoid race conditions
	if (!isCurrent()) {
		await stopCalendarSyncJob();
	}
};

export const registerCalendarSyncJob = (): (() => void) => {
	let generation = 0;
	let stopped = false;
	let wasOn = false;

	const stopWatching = settings.watchMultiple(WATCHED_SETTINGS, async () => {
		const started = ++generation;
		const on = isServerSyncOn();
		const turnedOff = wasOn && !on;
		wasOn = on;

		const isCurrent = () => !stopped && generation === started;
		const stillOff = () => isCurrent() && !isServerSyncOn();

		try {
			await configureCalendarSyncJob(isCurrent);

			if (turnedOff) {
				// In case a sync is in process
				await whenMailboxesIdle();

				await discardServerSyncedCalendarEvents(stillOff);
			}
		} catch (err) {
			logger.error({ msg: 'Could not configure the Exchange calendar sync job', err: scrubForLog(err) });
		}
	});

	return () => {
		stopped = true;
		stopWatching();

		void stopCalendarSyncJob().catch((err) =>
			logger.error({ msg: 'Could not stop the Exchange calendar sync job during cleanup', err: scrubForLog(err) }),
		);
	};
};
