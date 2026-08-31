import './tracing';
import './models';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings/definitions';

import { startRestAPI } from './api/api';
import { configureServer } from './configuration';
import { SystemLogger } from './lib/logger/system';
import { registerServices } from './services/startup';
import { settings } from './settings';
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
import './lib/oauthRedirectUri';
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
