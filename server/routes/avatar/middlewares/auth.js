import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';

import {
	userCanAccessAvatar,
} from '../utils';

// protect all avatar endpoints
WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function(req, res, next) {
	if (!userCanAccessAvatar(req)) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	return next();
}));
