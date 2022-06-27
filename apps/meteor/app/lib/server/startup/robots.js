import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../../settings/server';

Meteor.startup(function () {
	return WebApp.connectHandlers.use(
		'/robots.txt',
		Meteor.bindEnvironment(function (req, res /* , next*/) {
			res.writeHead(200);
			res.end(settings.get('Robot_Instructions_File_Content'));
		}),
	);
});
