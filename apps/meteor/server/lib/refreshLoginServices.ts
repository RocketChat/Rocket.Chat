import { LoginServiceConfiguration } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';

import { updateCasServices } from './cas/updateCasService';
import { notifyOnLoginServiceConfigurationChanged } from './notifyListener';
import { updateOAuthServices } from './oauth/updateOAuthServices';

export const refreshLoginServices = makeFunction(async (): Promise<void> => {
	const removedIds = await LoginServiceConfiguration.removeAll();
	removedIds.forEach((_id) => void notifyOnLoginServiceConfigurationChanged({ _id }, 'removed'));

	await Promise.allSettled([updateOAuthServices(), updateCasServices()]);
});
