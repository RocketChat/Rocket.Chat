import { WebApp } from 'meteor/webapp';

import { protectAvatars } from './auth';

WebApp.connectHandlers.use('/avatar/', protectAvatars);
