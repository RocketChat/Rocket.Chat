import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

Meteor.startup(function() {
	return WebApp.connectHandlers.use('/robots.txt', Meteor.bindEnvironment(function(req, res/* , next*/) {
		res.writeHead(200);
		res.end(RocketChat.settings.get('Robot_Instructions_File_Content'));
	}));
});
