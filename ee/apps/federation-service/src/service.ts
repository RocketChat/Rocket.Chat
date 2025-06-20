import 'reflect-metadata';
import { startMicroservice } from './modes/microservice';
import { api } from '@rocket.chat/core-services';
import { startBroker } from '@rocket.chat/network-broker';
import { HomeserverEventHandler } from './events/HomeserverEventHandler';

(async () => {
	api.setBroker(startBroker());

	const { FederationMatrix } = await import('./FederationMatrix');
	api.registerService(new FederationMatrix());
	await api.start();

	const homeserverEventHandler = new HomeserverEventHandler();
	const emitter = homeserverEventHandler.getEmitter();
	await startMicroservice({ emitter });
})();
