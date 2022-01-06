import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { RocketChatAssets } from '../../assets/server';

WebApp.connectHandlers.use(
	'/_blockstack/manifest',
	Meteor.bindEnvironment(function (req, res) {
		const name = settings.get('Site_Name');
		const startUrl = Meteor.absoluteUrl();
		const description = settings.get('Blockstack_Auth_Description');
		const iconUrl = RocketChatAssets.getURL('Assets_favicon_192');

		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		});

		res.end(`{
    "name": "${name}",
    "start_url": "${startUrl}",
    "description": "${description}",
    "icons": [{
      "src": "${iconUrl}",
      "sizes": "192x192",
      "type": "image/png"
    }]
  }`);
	}),
);
