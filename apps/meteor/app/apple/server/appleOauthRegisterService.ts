import { KJUR } from 'jsrsasign';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings, settingsRegistry } from '../../settings/server';
import { config } from '../lib/config';
import { AppleCustomOAuth } from './AppleCustomOAuth';

export const AppleOAuth = new AppleCustomOAuth('apple', config);

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

		const now = new Date();
		const exp = new Date();
		exp.setMonth(exp.getMonth() + 5); // from Apple docs expiration time must no be greater than 6 months

		const secret = KJUR.jws.JWS.sign(
			null,
			HEADER,
			{
				iss,
				iat: Math.floor(now.getTime() / 1000),
				exp: Math.floor(exp.getTime() / 1000),
				aud: 'https://appleid.apple.com',
				sub: clientId,
			},
			serverSecret as string,
		);

		ServiceConfiguration.configurations.upsert(
			{
				service: 'apple',
			},
			{
				$set: {
					showButton: true,
					secret,
					enabled: settings.get('Accounts_OAuth_Apple'),
					loginStyle: 'popup',
					clientId,
					buttonLabelText: 'Sign in with Apple',
					buttonColor: '#000',
					buttonLabelColor: '#FFF',
				},
			},
		);
	},
);
