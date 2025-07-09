import type { IFederationMatrixService } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { isRunningMs } from '../../../server/lib/isRunningMs';

const logger = new Logger('FederationRoutes');

export async function registerFederationRoutes(federationService: IFederationMatrixService): Promise<void> {
	if (isRunningMs()) {
		return;
	}

	try {
		const routes = federationService.getAllRoutes();
		(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(routes.matrix.router).use(routes.wellKnown.router);

		logger.log('[Federation] Registered federation routes');
	} catch (error) {
		logger.error('[Federation] Failed to register routes:', error);
		throw error;
	}
}
