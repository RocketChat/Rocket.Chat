import { Users } from '@rocket.chat/models';

import { logger } from './logger';

const indexedServices = new Set<string>();

export const ensureServiceIdIndex = async (serviceName: string): Promise<void> => {
	if (indexedServices.has(serviceName)) {
		return;
	}

	indexedServices.add(serviceName);

	try {
		await Users.createServiceIdIndex(serviceName);
	} catch (err) {
		indexedServices.delete(serviceName);
		logger.error({ msg: 'Failed to create the service id index for a login service', serviceName, err });
	}
};
