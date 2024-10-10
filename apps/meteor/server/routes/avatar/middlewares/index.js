import { WebApp } from 'meteor/webapp';

import { protectAvatars, protectAvatarsWithFallback } from './auth';

import './browserVersion';

WebApp.connectHandlers.use('/avatar/', protectAvatarsWithFallback);
WebApp.connectHandlers.use('/avatar/uid/', protectAvatars);
