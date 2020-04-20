import { WebApp } from 'meteor/webapp';

import { protectAvatars } from './auth';

import './browserversion';

WebApp.connectHandlers.use('/avatar/', protectAvatars);
