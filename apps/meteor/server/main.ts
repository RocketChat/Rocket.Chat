import './tracing';
import './models';

import { initSettingsStorage, settings } from './settings';

/**
 * Initialize settings store from MongoDB into CachedSettings memory
 */
await initSettingsStorage();

/**
 * Load settings schema definitions once storage cache is initialized
 */
await import('./settings/definitions');

import { startRestAPI } from './api/api';
import { configureServer } from './configuration';
import { SystemLogger } from './lib/logger/system';
import { registerServices } from './services/startup';
import { startup } from './startup';
import { startCronJobs } from './startup/cron';
import { startupApp } from '../ee/server';
import { startRocketChat } from '../startRocketChat';

import './routes';
import './startup/rateLimiter';
import './startup/robots';
import './importPackages';
import './meteor-methods';
import './publications';
import './lib/pushConfig';
import './features/EmailInbox/index';

await Promise.all([configureServer(settings), registerServices(), startup()]);

await startRocketChat();

setImmediate(() => {
	startCronJobs().catch((err) => {
		SystemLogger.error({ msg: 'Failed to start cron jobs', err });
	});
});

await startupApp();
await startRestAPI();
