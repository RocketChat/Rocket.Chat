import { api } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { HomeserverIntegrationService } from '../../../server/services/homeserver-integration';
import { HomeserverRouteRegistrar } from '../../../server/services/homeserver-integration/RouteRegistrar';

/**
 * Start the homeserver integration service
 * This uses tsyringe internally but presents a standard Rocket.Chat service interface
 */
export const startHomeserverIntegration = async (): Promise<void> => {
	// Only start if federation is enabled
	void License.onLicense('federation', async () => {
		// Create and register the service
		const homeserverService = new HomeserverIntegrationService();
		await api.registerService(homeserverService);

		// Register routes after service is initialized
		await homeserverService.created();
		HomeserverRouteRegistrar.registerRoutes(homeserverService);

		console.log('Homeserver integration enabled with federation license');
	});
};