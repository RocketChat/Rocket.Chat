import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { settings } from '../../../../settings/server';
import { OpenIDConnect } from './openid_connect_server';

Meteor.startup(() => {
	settings.watch('OIDC_Enable', (enabled) => {
		if (!enabled) {
			ServiceConfiguration.configurations.remove({ service: 'oidc' });
			return;
		}

		const issuer = settings.get('OIDC_Issuer');
		const clientId = settings.get('OIDC_Client_ID');
		const clientSecret = settings.get('OIDC_Client_Secret');

		ServiceConfiguration.configurations.upsert(
			{ service: 'oidc' },
			{
				$set: {
					issuer,
					clientId,
					secret: clientSecret,
					loginStyle: 'popup',
				},
			},
		);

		new OpenIDConnect('oidc', {
			issuer,
			clientId,
			clientSecret,
		});
	});
});
