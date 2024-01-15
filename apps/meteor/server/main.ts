import './models/startup';
/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';
import { startLicense } from '../ee/app/license/server/startup';
import { registerEEBroker } from '../ee/server';
import { configureLogLevel } from './configureLogLevel';
import { registerServices } from './services/startup';
import { startup } from './startup';

import './lib/logger/startup';

import '../app/lib/server/startup';

import './importPackages';
import './methods';
import './publications';
import './routes';
import '../lib/oauthRedirectUriServer';

import './lib/pushConfig';

import './configuration/accounts_meld';
import './configuration/ldap';

import './stream/stdout';
import './features/EmailInbox/index';

await (async () => {
	await configureLogLevel();
	await registerServices();
	await import('../app/settings/server');
	await registerEEBroker();
	await startup();
	await startLicense();
})();
