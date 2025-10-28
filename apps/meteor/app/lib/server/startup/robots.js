import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../../settings/server';

Meteor.startup(() => {
	return WebApp.connectHandlers.use('/robots.txt', (req, res /* , next*/) => {
		res.writeHead(200);
		res.end(settings.get('Robot_Instructions_File_Content'));
	});
});
