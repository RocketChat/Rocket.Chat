import { makeFunction } from '@rocket.chat/patch-injection';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { updateCasServices } from './cas/updateCasService';
import { updateOAuthServices } from './oauth/updateOAuthServices';

export const refreshLoginServices = makeFunction(async (): Promise<void> => {
	await ServiceConfiguration.configurations.removeAsync({});

	await Promise.allSettled([updateOAuthServices(), updateCasServices()]);
});
