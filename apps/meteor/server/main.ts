import { Logger } from '@rocket.chat/logger';

import './models/startup';
/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { configureLoginServices } from './configuration';
import { configureLogLevel } from './configureLogLevel';
import { registerServices } from './services/startup';
import { startup } from './startup';

import './routes';
import '../app/lib/server/startup';

const StartupLogger = new Logger('StartupLogger');

StartupLogger.startup('Starting Rocket.Chat server...');

await import('../app/settings/server').then(() => StartupLogger.startup('Settings started'));
await registerEEBroker().then(() => StartupLogger.startup('EE Broker registered'));

await Promise.all([
	import('./importPackages').then(() => StartupLogger.startup('Imported packages')),
	import('./methods').then(() => StartupLogger.startup('Imported methods')),
	import('./publications').then(() => StartupLogger.startup('Imported publications')),
	import('./lib/logger/startup').then(() => StartupLogger.startup('Logger started')),
	import('../lib/oauthRedirectUriServer').then(() => StartupLogger.startup('OAuth redirect uri server started')),
	import('./lib/pushConfig').then(() => StartupLogger.startup('Push configuration started')),
	import('./features/EmailInbox/index').then(() => StartupLogger.startup('EmailInbox started')),
	configureLogLevel().then(() => StartupLogger.startup('Log level configured')),
	registerServices().then(() => StartupLogger.startup('Services registered')),
	import('../ee/server/startup/services'),
	configureLoginServices().then(() => StartupLogger.startup('Login services configured')),
	startup().then(() => StartupLogger.startup('Startup finished')),
]);

await startLicense().then(() => StartupLogger.startup('License started'));

StartupLogger.startup('Rocket.Chat server started.');
