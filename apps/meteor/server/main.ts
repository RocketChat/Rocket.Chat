import './tracing';
import './models';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { configureServer } from './configuration';
import { registerServices } from './services/startup';
import { startup } from './startup';
import { settings } from '../app/settings/server';
import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { startFederationService } from '../ee/server/startup/services';

import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

await Promise.all([configureServer(settings), registerServices(), registerEEBroker(), startup()]);

await startLicense();

await Promise.all([startFederationService()]);
