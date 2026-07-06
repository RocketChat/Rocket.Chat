import './tracing';
import './models';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings/definitions';

import { startRestAPI } from './api/api';
import { configureServer } from './configuration';
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
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

await Promise.all([configureServer(settings), registerServices(), startup()]);

await startRocketChat();

// Cron jobs start only after startRocketChat() has applied the license, so jobs
// that contact Rocket.Chat Cloud on boot (e.g. the usage report) respect the
// offline license flag from their very first run.
setImmediate(() => startCronJobs());

await startupApp();
await startRestAPI();
