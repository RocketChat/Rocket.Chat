import { WebApp } from 'meteor/webapp';

import { protectAvatarsWithFallback, protectAvatars } from './auth';
import { handleBrowserVersionCheck } from './browserVersion';

WebApp.connectHandlers.use(handleBrowserVersionCheck);
WebApp.connectHandlers.use('/avatar/uid/', protectAvatars);
WebApp.connectHandlers.use('/avatar/', protectAvatarsWithFallback);
