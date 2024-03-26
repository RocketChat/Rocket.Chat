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

await import('./importPackages');
await import('./methods');
await import('./publications');

await import('./lib/logger/startup');

await import('../lib/oauthRedirectUriServer');

await import('./lib/pushConfig');

await import('./stream/stdout');
await import('./features/EmailInbox/index');

await configureLogLevel();
await registerServices();
await import('../app/settings/server');
await configureLoginServices();
await registerEEBroker();
await startup();
await startLicense();
