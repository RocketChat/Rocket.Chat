import { Meteor } from 'meteor/meteor';

import './routes.js';
import './settings.js';
import './loginHandler.js';

Meteor.isDevelopment = (process.env.ROOT_URL.indexOf('localhost') !== -1);
