import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';

WebApp.connectHandlers.use('/.well-known/apple-developer-domain-association.txt', Meteor.bindEnvironment(function(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/plain',
		'Access-Control-Allow-Origin': '*',
	});

	res.end(settings.get('Accounts_OAuth_Apple_manifest'));
}));
