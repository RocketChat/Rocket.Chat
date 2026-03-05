import './appcache';
import './callbacks';
import { startCronJobs } from './cron';
import './initialData';
import './serverRunning';
import './coreApps';
import { generateFederationKeys } from './generateKeys';
import './presenceTroubleshoot';
import '../hooks';
import '../lib/rooms/roomTypes';
import '../lib/settingsRegenerator';
import { performMigrationProcedure } from './migrations';
import { isRunningMs } from '../lib/isRunningMs';

export const startup = async () => {
	await performMigrationProcedure();

	await generateFederationKeys();

	setImmediate(() => {
		startCronJobs().catch((error) => {
			console.error('Failed to start cron jobs:', error);
		});
	});

	if (!isRunningMs()) {
		require('./localServices');
	}
};
