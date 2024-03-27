import { Logger } from '@rocket.chat/logger';

import './models/startup';
/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';
import '../app/settings/server';

import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { startFederationService } from '../ee/server/startup/services';
import { configureLoginServices } from './configuration';
import { configureLogLevel } from './configureLogLevel';
import { registerServices } from './services/startup';
import { startup } from './startup';

import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import './lib/logger/startup';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

const StartupLogger = new Logger('StartupLogger');

StartupLogger.startup('Starting Rocket.Chat server...');

await registerEEBroker().then(() => StartupLogger.startup('EE Broker registered'));

await Promise.all([
	configureLogLevel().then(() => StartupLogger.startup('Log level configured')),
	registerServices().then(() => StartupLogger.startup('Services registered')),
	configureLoginServices().then(() => StartupLogger.startup('Login services configured')),
	startup().then(() => StartupLogger.startup('Startup finished')),
]);

await startLicense().then(() => StartupLogger.startup('License started'));
await startFederationService();
StartupLogger.startup('Rocket.Chat server started.');
