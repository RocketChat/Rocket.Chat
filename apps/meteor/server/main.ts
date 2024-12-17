import './tracing';
import './models/startup';
/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { configureLoginServices } from './configuration';
import { configureLogLevel } from './configureLogLevel';
import { registerServices } from './services/startup';
import { startup } from './startup';
import { configureBoilerplate } from './startup/configureBoilerplate';
import { configureDirectReply } from './startup/configureDirectReply';
import { configureFederation } from './startup/settings';
import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { configureSMTP } from './startup/configureSMTP';
import { configurePushNotifications } from './startup/pushNotification';
import { settings } from '../app/settings/server';
import { startFederationService } from '../ee/server/startup/services';

import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import './lib/logger/startup';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

await Promise.all([configureLogLevel(), registerServices(), registerEEBroker(), startup()]);

await startLicense();

await Promise.all([configureLoginServices(), startFederationService()]);

await Promise.all([
	configurePushNotifications(settings),
	configureBoilerplate(settings),
	configureDirectReply(settings),
	configureSMTP(settings),
	configureFederation(settings),
]);
