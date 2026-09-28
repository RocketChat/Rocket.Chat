import { cronJobs } from '@rocket.chat/cron';
import { isValidCron } from 'cron-validator';

import { runContactSync } from './runContactSync';
import { settings } from '../../../../../../server/settings';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

export const CONTACT_SYNC_JOB = 'Exchange_Contacts_Sync';

const WATCHED_SETTINGS = ['Outlook_Calendar_Enabled', 'Exchange_Mode', 'Exchange_Contacts_Sync_Enabled'];

const DAILY_AT_HOUR = 3;

const stopContactSyncJob = async (): Promise<void> => {
	if (await cronJobs.has(CONTACT_SYNC_JOB)) {
		await cronJobs.remove(CONTACT_SYNC_JOB);
	}
};

export const configureContactSyncJob = async (): Promise<void> => {
	await stopContactSyncJob();

	if (
		!settings.get<boolean>('Outlook_Calendar_Enabled') ||
		settings.get<string>('Exchange_Mode') !== 'server' ||
		!settings.get<boolean>('Exchange_Contacts_Sync_Enabled')
	) {
		return;
	}

	const schedule = `0 ${DAILY_AT_HOUR} * * *`;

	// An invalid expression does not throw at add() time, it yields no next run and the job never fires.
	if (!isValidCron(schedule)) {
		logger.error({ msg: 'Refusing to schedule the Exchange contact sync job with an invalid schedule', schedule });
		return;
	}

	logger.info({ msg: 'Scheduling the Exchange contact sync job', schedule });

	await cronJobs.add(CONTACT_SYNC_JOB, schedule, async () => runContactSync());
};

export const registerContactSyncJob = (): (() => void) => {
	const stopWatching = settings.watchMultiple(WATCHED_SETTINGS, () => {
		void configureContactSyncJob().catch((err) =>
			logger.error({ msg: 'Could not configure the Exchange contact sync job', err: scrubForLog(err) }),
		);
	});

	return () => {
		stopWatching();

		void stopContactSyncJob().catch((err) =>
			logger.error({ msg: 'Could not stop the Exchange contact sync job during cleanup', err: scrubForLog(err) }),
		);
	};
};
