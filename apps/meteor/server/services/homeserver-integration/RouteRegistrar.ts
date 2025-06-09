import { API } from '../../../app/api/server';
import type { HomeserverIntegrationService } from './HomeserverIntegrationService';

/**
 * Registers homeserver routes with Rocket.Chat's API system
 */
export class HomeserverRouteRegistrar {
	static registerRoutes(service: HomeserverIntegrationService): void {
		const handlers = service.getRouteHandlers();

		handlers.forEach(handler => {
			// Convert homeserver route to Rocket.Chat API route
			const rcRoute = {
				authRequired: handler.options?.auth ?? false,
				license: ['federation'], // Requires federation license
			};

			// Create handler wrapper
			const createHandler = (method: string) => {
				return async function(this: any) {
					try {
						// Extract params based on method
						const params = method === 'GET' ? this.queryParams : this.bodyParams;
						const urlParams = this.urlParams || {};
						
						// Merge URL params into params object
						const allParams = { ...params, ...urlParams };

						// Call the homeserver handler
						const result = await service.handleFederationRequest(
							handler.path,
							handler.method,
							allParams,
							this.bodyParams,
							this.request.headers
						);

						return API.v1.success(result);
					} catch (error: any) {
						return API.v1.failure(error.message);
					}
				};
			};

			// Register route based on method
			switch (handler.method) {
				case 'GET':
					API.v1.addRoute(handler.path, rcRoute, {
						get: createHandler('GET'),
					});
					break;
				case 'POST':
					API.v1.addRoute(handler.path, rcRoute, {
						post: createHandler('POST'),
					});
					break;
				case 'PUT':
					API.v1.addRoute(handler.path, rcRoute, {
						put: createHandler('PUT'),
					});
					break;
				case 'DELETE':
					API.v1.addRoute(handler.path, rcRoute, {
						delete: createHandler('DELETE'),
					});
					break;
			}
		});
	}
}