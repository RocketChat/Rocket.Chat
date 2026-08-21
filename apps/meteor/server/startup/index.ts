import './appcache';
import './callbacks';
import { ensureMessagesTextIndex } from './ensureMessagesTextIndex';
import './initialData';
import './serverRunning';
import './coreApps';
import { generateFederationKeys } from './generateKeys';
import './presenceTroubleshoot';
import './httpSocketTimeout';
import '../hooks';
import '../lib/rooms/roomTypes';
import '../lib/settingsRegenerator';
import { performMigrationProcedure } from './migrations';
import { isRunningMs } from '../lib/isRunningMs';

export const startup = async () => {
	await performMigrationProcedure();

	await generateFederationKeys();

	// NOTE: cron jobs are started from main.ts after startRocketChat(), so jobs
	// that contact Rocket.Chat Cloud on boot (e.g. the usage report) run only
	// after the license — including the offline flag — has been applied.
	setImmediate(() => ensureMessagesTextIndex());
	// only starts network broker if running in micro services mode
	if (!isRunningMs()) {
		require('./localServices');
	}
};
