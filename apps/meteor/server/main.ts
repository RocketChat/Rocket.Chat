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

StartupLogger.info('Starting Rocket.Chat server...');

await import('../app/settings/server').then(() => StartupLogger.info('Settings started'));

await Promise.all([
	import('./importPackages').then(() => StartupLogger.info('Imported packages')),
	import('./methods').then(() => StartupLogger.info('Imported methods')),
	import('./publications').then(() => StartupLogger.info('Imported publications')),
	import('./lib/logger/startup').then(() => StartupLogger.info('Logger started')),
	import('../lib/oauthRedirectUriServer').then(() => StartupLogger.info('OAuth redirect uri server started')),
	import('./lib/pushConfig').then(() => StartupLogger.info('Push configuration started')),
	import('./features/EmailInbox/index').then(() => StartupLogger.info('EmailInbox started')),
	configureLogLevel().then(() => StartupLogger.info('Log level configured')),
	registerServices().then(() => StartupLogger.info('Services registered')),
	configureLoginServices().then(() => StartupLogger.info('Login services configured')),
	registerEEBroker().then(() => StartupLogger.info('EE Broker registered')),
	startup().then(() => StartupLogger.info('Startup finished')),
]);

await startLicense().then(() => StartupLogger.info('License started'));

await import('../ee/server/startup/services');

StartupLogger.info('Rocket.Chat server started.');
