import { WebApp } from 'meteor/webapp';

import { protectAvatars } from './auth';

import './browserVersion';

WebApp.connectHandlers.use('/avatar/', protectAvatars);
