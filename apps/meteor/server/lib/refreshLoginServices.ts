import { ServiceConfiguration } from 'meteor/service-configuration';

import { notifyOnLoginServiceConfigurationChangedById } from '../../app/lib/server/lib/notifyListener';
import { loadSamlServiceProviders } from '../../app/meteor-accounts-saml/server/lib/settings';
import { updateCasServices } from './cas/updateCasService';
import { updateOAuthServices } from './oauth/updateOAuthServices';

export async function refreshLoginServices(): Promise<void> {
	await ServiceConfiguration.configurations.removeAsync({});

	const [oAuthServices] = await Promise.allSettled([updateOAuthServices(), loadSamlServiceProviders(), updateCasServices()]);

	if (oAuthServices.status === 'fulfilled') {
		await Promise.all(
			oAuthServices.value.map((service) =>
				notifyOnLoginServiceConfigurationChangedById(service._id, service.deleted ? 'removed' : 'inserted'),
			),
		);
	}
}
