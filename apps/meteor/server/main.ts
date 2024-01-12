import './models/startup';
import './settings';
// import { initializeSettings } from '../app/settings/server';
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

void (async () => {
	await configureLogLevel();
	await registerServices();
	await import('../app/settings/server');
	await registerEEBroker();
	await startup();
	await startLicense();
})();
