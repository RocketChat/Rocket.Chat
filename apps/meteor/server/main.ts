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

StartupLogger.log('Starting Rocket.Chat server...');

await import('../app/settings/server').then(() => StartupLogger.log('Settings started'));

await Promise.all([
	import('./importPackages').then(() => StartupLogger.log('Imported packages')),
	import('./methods').then(() => StartupLogger.log('Imported methods')),
	import('./publications').then(() => StartupLogger.log('Imported publications')),
	import('./lib/logger/startup').then(() => StartupLogger.log('Logger started')),
	import('../lib/oauthRedirectUriServer').then(() => StartupLogger.log('OAuth redirect uri server started')),
	import('./lib/pushConfig').then(() => StartupLogger.log('Push configuration started')),
	import('./features/EmailInbox/index').then(() => StartupLogger.log('EmailInbox started')),
	configureLogLevel().then(() => StartupLogger.log('Log level configured')),
	registerServices().then(() => StartupLogger.log('Services registered')),
	configureLoginServices().then(() => StartupLogger.log('Login services configured')),
	registerEEBroker().then(() => StartupLogger.log('EE Broker registered')),
	startup().then(() => StartupLogger.log('Startup finished')),
]);

await startLicense().then(() => StartupLogger.log('License started'));

await import('../ee/server/startup/services');

StartupLogger.log('Rocket.Chat server started.');
