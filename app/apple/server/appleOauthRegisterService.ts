import { KJUR } from 'jsrsasign';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings, settingsRegistry } from '../../settings/server';

const config = {
	serverURL: 'https://appleid.apple.com',
	tokenPath: '/auth/token',
	scope: 'name email',
	mergeUsers: true,
	accessTokenParam: 'access_token',
	loginStyle: 'popup',
};

new CustomOAuth('apple', config);

settingsRegistry.addGroup('OAuth', function () {
	this.section('Apple', function () {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });

		this.add('Accounts_OAuth_Apple_id', '', { type: 'string', public: true });
		this.add('Accounts_OAuth_Apple_secretKey', '', { type: 'string', multiline: true });

		this.add('Accounts_OAuth_Apple_iss', '', { type: 'string' });
		this.add('Accounts_OAuth_Apple_kid', '', { type: 'string' });
	});
});

settings.watchMultiple(
	[
		'Accounts_OAuth_Apple',
		'Accounts_OAuth_Apple_id',
		'Accounts_OAuth_Apple_secretKey',
		'Accounts_OAuth_Apple_iss',
		'Accounts_OAuth_Apple_kid',
	],
	([enabled, clientId, serverSecret, iss, kid]) => {
		if (!enabled) {
			return ServiceConfiguration.configurations.remove({
				service: 'apple',
			});
		}

		const HEADER = {
			kid,
			alg: 'ES256',
		};

		const tokenPayload = {
			iss,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 300,
			aud: 'https://appleid.apple.com',
			sub: clientId,
		};

		const secret = KJUR.jws.JWS.sign(null, HEADER, tokenPayload, serverSecret as string);

		ServiceConfiguration.configurations.upsert(
			{
				service: 'apple',
			},
			{
				$set: {
					// We'll hide this button on Web Client
					showButton: false,
					secret,
					enabled: settings.get('Accounts_OAuth_Apple'),
					loginStyle: 'popup',
					clientId,
				},
			},
		);
	},
);
