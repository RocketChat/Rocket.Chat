// import { Meteor } from 'meteor/meteor';
// import { Tracker } from 'meteor/tracker';
// import _ from 'underscore';

import { jws } from 'jsrsasign';
import { ServiceConfiguration } from 'meteor/service-configuration';


/* eslint-disable @typescript-eslint/camelcase */

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings, settingsRegistry } from '../../settings/server';


const config = {
	serverURL: 'https://appleid.apple.com',
	identityPath: '/auth/token',
	scope: 'name email',
	mergeUsers: true,
	accessTokenParam: 'access_token',
	loginStyle: 'redirect',
};

// chat.rocket.gazzo

new CustomOAuth('apple', config);

settingsRegistry.addGroup('OAuth', function() {
	this.section('Apple', function() {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });


		this.add('Accounts_OAuth_Apple_clientId', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });
		this.add('Accounts_OAuth_Apple_secret', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });
		this.add('Accounts_OAuth_Apple_manifest', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });
		this.add('Accounts_OAuth_Apple_redirectUri', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });

		this.add('Accounts_OAuth_Apple_iss', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });
		this.add('Accounts_OAuth_Apple_kid', '', { type: 'string', enableQuery: { Accounts_OAuth_Apple: true } });
	});
});


settings.watchMultiple(['Accounts_OAuth_Apple', 'Accounts_OAuth_Apple_clientId', 'Accounts_OAuth_Apple_secret', 'Accounts_OAuth_Apple_iss', 'Accounts_OAuth_Apple_kid'], ([enabled, clientId, serverSecret, iss, kid]) => {
	if (!enabled) {
		return ServiceConfiguration.configurations.remove({
			service: 'apple',
		});
	}

	const HEADER = {
		typ: 'JWT',
		kid,
		alg: 'ES256',
	};


	const tokenPayload = {
		iss,
		iat: jws.IntDate.get('now'),
		exp: 15780000,
		aud: 'https://appleid.apple.com',
		sub: clientId,
	};

	const header = JSON.stringify(HEADER);


	ServiceConfiguration.configurations.upsert({
		service: 'apple',
	}, {
		$set: {
			// We'll hide this button on Web Client
			showButton: false,
			secret: jws.JWS.sign(HEADER.alg, header, JSON.stringify(tokenPayload), { rstr: serverSecret }),
			enabled: settings.get('Accounts_OAuth_Apple'),
			loginStyle: 'redirect',
			clientId,
		},
	});
});
