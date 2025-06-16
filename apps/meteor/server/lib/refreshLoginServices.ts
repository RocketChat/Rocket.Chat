import { ServiceConfiguration } from 'meteor/service-configuration';

import { updateCasServices } from './cas/updateCasService';
import { updateOAuthServices } from './oauth/updateOAuthServices';
import { loadSamlServiceProviders } from '../../app/meteor-accounts-saml/server/lib/settings';

export async function refreshLoginServices(): Promise<void> {
	await ServiceConfiguration.configurations.removeAsync({});

	await Promise.allSettled([updateOAuthServices(), loadSamlServiceProviders(), updateCasServices()]);
}
