import { Meteor } from 'meteor/meteor';

import './routes.js';
import './settings.js';
import './tokenHandler.js';
import './userHandler.js';
import './loginHandler.js';
import './logoutHandler.js';

Meteor.isDevelopment = (process.env.ROOT_URL.indexOf('localhost') !== -1);
