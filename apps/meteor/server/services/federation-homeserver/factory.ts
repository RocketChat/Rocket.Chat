import { FederationHomeserverServiceClass } from './service';
import { api } from '@rocket.chat/core-services';

// Factory to create and register the federation homeserver service
export async function createFederationHomeserverService(): Promise<FederationHomeserverServiceClass> {
	const service = new FederationHomeserverServiceClass();
	
	// Register the service
	api.registerService(service);
	
	console.log('[FederationHomeserver] Service registered');
	
	return service;
}