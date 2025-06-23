import 'reflect-metadata';
import { startMicroservice } from './modes/microservice';
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { HomeserverEventHandler } from './events/HomeserverEventHandler';

(async () => {
	// Set up database connection
	const { db } = await getConnection();
	registerServiceModels(db, await getTrashCollection());

	// Set up broker
	api.setBroker(startBroker());

	// Import and create federation service
	const { FederationMatrix } = await import('./FederationMatrix');
	const federationService = new FederationMatrix();
	
	// Create and connect homeserver event handler
	const homeserverEventHandler = new HomeserverEventHandler();
	federationService.setHomeserverEventHandler(homeserverEventHandler);
	
	// Register and start the service
	api.registerService(federationService);
	await api.start();

	// Start the microservice with the event emitter
	const emitter = homeserverEventHandler.getEmitter();
	await startMicroservice({ emitter });
})();
