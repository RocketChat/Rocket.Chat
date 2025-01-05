import './tracing';
import './startup/database';
import './startup/broker';

// FIXME: It could be a listener inside of some setting watcher
import './lib/logger/startup';

// FIXME: This should be removed
import './startup/appcache';
import './startup/callbacks';
import './startup/cron';
import './startup/initialData';
import './startup/serverRunning';
import './startup/coreApps';
import './startup/presenceTroubleshoot';
import './hooks';
import './lib/rooms/roomTypes';
import './lib/settingsRegenerator';
import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';

import { configureLoginServices } from './configuration';
import { registerServices } from './services/startup';

await registerServices();

await configureLoginServices();
