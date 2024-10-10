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

await Promise.all([configureLogLevel(), registerServices(), registerEEBroker(), startup()]);

await startLicense();

await Promise.all([configureLoginServices(), startFederationService()]);
