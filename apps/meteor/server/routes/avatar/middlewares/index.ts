import { WebApp } from 'meteor/webapp';

import { protectAvatarsWithFallback } from './auth';
import { handleBrowserVersionCheck } from './browserVersion';

WebApp.connectHandlers.use(handleBrowserVersionCheck);
WebApp.connectHandlers.use('/avatar/', protectAvatarsWithFallback);
