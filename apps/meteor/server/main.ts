import './models/startup';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { libStartup } from '../app/lib/server/startup';
import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { configureLogLevel } from './configureLogLevel';
import { registerServices } from './services/startup';
import { startup } from './startup';
import './importPackages';
import './methods';
import './publications';
import './routes';

await import('./lib/logger/startup');

await import('../lib/oauthRedirectUriServer');

await import('./lib/pushConfig');

await import('./configuration/accounts_meld');
await import('./configuration/cas');
await import('./configuration/ldap');

await import('./stream/stdout');
await import('./features/EmailInbox/index');

await libStartup();
await configureLogLevel();
await registerServices();
await import('../app/settings/server');
await registerEEBroker();
await startup();
await startLicense();
